import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TokenStore, UserRole } from '@notary-portal/ui';
import { AssessmentApiService } from './assessment-api.service';
import { DocumentApiService } from './document-api.service';
import { EstimationForm } from './estimation-form';
import { EstimationFormSessionService } from './estimation-form-session.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const CITY_ID = 'city-1';
const DISTRICT_ID = 'district-1';
const OBJECT_TYPE_VALUE = '1';
const CONDITION_VALUE = '2';

describe('EstimationForm', () => {
  let component: EstimationForm;
  let fixture: ComponentFixture<EstimationForm>;
  let router: Router;
  let navigateSpy: jest.SpiedFunction<Router['navigate']>;
  let assessmentApi: {
    getAssessment: jest.Mock;
    findLatestDraft: jest.Mock;
    createDraft: jest.Mock;
    updateDraft: jest.Mock;
    listCities: jest.Mock;
    listDistricts: jest.Mock;
  };
  let documentApi: {
    listDocumentsByAssessment: jest.Mock;
    uploadDocument: jest.Mock;
  };

  beforeEach(async () => {
    assessmentApi = {
      getAssessment: jest.fn(),
      findLatestDraft: jest.fn().mockResolvedValue(null),
      createDraft: jest.fn().mockResolvedValue(createDraftModel('assessment-1')),
      updateDraft: jest.fn(),
      listCities: jest.fn().mockResolvedValue([{ id: CITY_ID, name: 'Москва' }]),
      listDistricts: jest
        .fn()
        .mockResolvedValue([{ id: DISTRICT_ID, cityId: CITY_ID, name: 'Центральный' }]),
    };

    documentApi = {
      listDocumentsByAssessment: jest.fn().mockResolvedValue([]),
      uploadDocument: jest
        .fn()
        .mockResolvedValue(createStoredDocument('document-1', 'passport.pdf', 'document')),
    };

    await TestBed.configureTestingModule({
      imports: [EstimationForm],
      providers: [
        provideRouter([]),
        {
          provide: AssessmentApiService,
          useValue: assessmentApi,
        },
        {
          provide: DocumentApiService,
          useValue: documentApi,
        },
        {
          provide: TokenStore,
          useValue: {
            user: signal({
              id: USER_ID,
              email: 'applicant@example.com',
              fullName: 'Applicant User',
              role: UserRole.Applicant,
              phoneNumber: '',
              isActive: true,
            }),
            hasSession: jest.fn().mockReturnValue(false),
          },
        },
        {
          provide: EstimationFormSessionService,
          useValue: {
            ensureUserId: jest.fn().mockResolvedValue(USER_ID),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EstimationForm);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should save draft, upload pending files and navigate to status page', async () => {
    await fillRequiredFields(fixture, component);

    await component.onSubmit(new Event('submit'), getFormElement(fixture));

    expect(assessmentApi.createDraft).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        cityId: CITY_ID,
        address: 'Москва, Тверская ул., д. 10',
        area: '54.6',
        objectType: OBJECT_TYPE_VALUE,
        floorsTotal: '9',
        condition: CONDITION_VALUE,
      }),
    );
    expect(documentApi.uploadDocument).toHaveBeenCalledTimes(2);
    expect(navigateSpy).toHaveBeenCalledWith(['/applicant/assessment/status'], {
      queryParams: { assessmentId: 'assessment-1' },
    });
    expect(component.validationErrorMessage).toBe('');
  });

  it('should block submission when required documents are missing', async () => {
    await fillRequiredFields(fixture, component, { includeDocuments: false });

    await component.onSubmit(new Event('submit'), getFormElement(fixture));

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(assessmentApi.createDraft).not.toHaveBeenCalled();
    expect(component.validationErrorMessage).toContain('Сканы и документы');
  });

  it('should block submission when a required confirmation is missing', async () => {
    await fillRequiredFields(fixture, component, { confirmProcessing: false });

    await component.onSubmit(new Event('submit'), getFormElement(fixture));

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(assessmentApi.createDraft).not.toHaveBeenCalled();
    expect(component.validationErrorMessage).toContain('Согласен(на) на обработку данных');
  });

  it('should block submission when correctness confirmation is missing', async () => {
    await fillRequiredFields(fixture, component, { confirmCorrect: false });

    await component.onSubmit(new Event('submit'), getFormElement(fixture));

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(assessmentApi.createDraft).not.toHaveBeenCalled();
    expect(component.validationErrorMessage).toContain('Подтверждаю, что данные введены корректно');
  });

  it('should append newly selected files instead of replacing the previous ones', () => {
    const inputElement = document.createElement('input');
    const passportFile = createFile('passport.pdf', 'application/pdf');
    const planFile = createFile('plan.pdf', 'application/pdf');

    setInputFiles(inputElement, [passportFile]);
    component.onFilesSelected(createFileSelectionEvent(inputElement), 'documents');

    setInputFiles(inputElement, [planFile]);
    component.onFilesSelected(createFileSelectionEvent(inputElement), 'documents');

    expect(component.documentFiles).toEqual([passportFile, planFile]);
  });

  it('should open consent modal from the processing agreement link', () => {
    const consentLink = fixture.nativeElement.querySelector(
      '#confirmProcessingLink',
    ) as HTMLButtonElement;

    consentLink.click();
    fixture.detectChanges();

    expect(component.isConsentModalOpen).toBe(true);
    expect(fixture.nativeElement.querySelector('#consentDocumentTitle')?.textContent).toContain(
      'СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ',
    );
  });
});

function createDraftModel(id: string) {
  return {
    id,
    status: 1,
    form: {
      cityId: '',
      districtId: '',
      address: '',
      area: '',
      objectType: '',
      rooms: '',
      floorsTotal: '',
      floor: '',
      condition: '',
      yearBuilt: '',
      wallMaterial: '',
      elevatorType: '',
      description: '',
    },
  };
}

function createStoredDocument(id: string, fileName: string, kind: 'document' | 'photo') {
  return {
    id,
    fileName,
    fileType: kind === 'photo' ? 'image/jpeg' : 'application/pdf',
    version: 1,
    uploadedAt: null,
    kind,
  };
}

async function fillRequiredFields(
  fixture: ComponentFixture<EstimationForm>,
  component: EstimationForm,
  options: {
    includeDocuments?: boolean;
    includePhotos?: boolean;
    confirmCorrect?: boolean;
    confirmProcessing?: boolean;
  } = {},
): Promise<void> {
  component.form = {
    ...component.form,
    cityId: CITY_ID,
    districtId: DISTRICT_ID,
    address: 'Москва, Тверская ул., д. 10',
    area: '54.6',
    objectType: OBJECT_TYPE_VALUE,
    floorsTotal: '9',
    condition: CONDITION_VALUE,
    confirmCorrect: options.confirmCorrect ?? true,
    confirmProcessing: options.confirmProcessing ?? true,
  };

  component.documentFiles =
    options.includeDocuments === false ? [] : [createFile('passport.pdf', 'application/pdf')];
  component.photoFiles =
    options.includePhotos === false ? [] : [createFile('front.jpg', 'image/jpeg')];
  component.additionalFiles = [];

  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function createFile(name: string, type: string): File {
  return new File(['file-content'], name, { type });
}

function getFormElement(fixture: ComponentFixture<EstimationForm>): HTMLFormElement {
  return fixture.nativeElement.querySelector('form') as HTMLFormElement;
}

function createFileSelectionEvent(inputElement: HTMLInputElement): Event {
  return { target: inputElement } as Event;
}

function setInputFiles(inputElement: HTMLInputElement, files: File[]): void {
  if (typeof DataTransfer !== 'undefined') {
    const dataTransfer = new DataTransfer();
    for (const file of files) {
      dataTransfer.items.add(file);
    }

    Object.defineProperty(inputElement, 'files', {
      configurable: true,
      value: dataTransfer.files,
    });
    return;
  }

  Object.defineProperty(inputElement, 'files', {
    configurable: true,
    value: files,
  });
}
