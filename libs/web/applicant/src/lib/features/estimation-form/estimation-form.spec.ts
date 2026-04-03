import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TokenStore, UserRole } from '@notary-portal/ui';
import { AssessmentApiService } from './assessment-api.service';
import { DocumentApiService } from './document-api.service';
import { EstimationForm } from './estimation-form';
import { EstimationFormLocalDraftService } from './estimation-form-local-draft.service';
import { EstimationFormSessionService } from './estimation-form-session.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const CITY_ID = 'city-1';
const OTHER_CITY_ID = 'city-2';
const DISTRICT_ID = 'district-1';
const OTHER_DISTRICT_ID = 'district-2';
const OBJECT_TYPE_VALUE = '1';
const LAND_PLOT_TYPE_VALUE = '5';
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
  let localDraftService: {
    load: jest.Mock;
    save: jest.Mock;
    clear: jest.Mock;
  };

  beforeEach(async () => {
    assessmentApi = {
      getAssessment: jest.fn(),
      findLatestDraft: jest.fn().mockResolvedValue(null),
      createDraft: jest.fn().mockResolvedValue(createDraftModel('assessment-1')),
      updateDraft: jest.fn().mockResolvedValue(createDraftModel('assessment-1')),
      listCities: jest.fn().mockResolvedValue([
        { id: CITY_ID, name: 'Москва' },
        { id: OTHER_CITY_ID, name: 'Екатеринбург' },
      ]),
      listDistricts: jest.fn().mockImplementation((cityId?: string) => {
        if (cityId === OTHER_CITY_ID) {
          return Promise.resolve([
            { id: OTHER_DISTRICT_ID, cityId: OTHER_CITY_ID, name: 'Ленинский' },
          ]);
        }

        return Promise.resolve([{ id: DISTRICT_ID, cityId: CITY_ID, name: 'Центральный' }]);
      }),
    };

    documentApi = {
      listDocumentsByAssessment: jest.fn().mockResolvedValue([]),
      uploadDocument: jest
        .fn()
        .mockResolvedValue(createStoredDocument('document-1', 'passport.pdf', 'document')),
    };

    localDraftService = {
      load: jest.fn().mockReturnValue(null),
      save: jest.fn(),
      clear: jest.fn(),
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
            hasSession: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: EstimationFormSessionService,
          useValue: {
            ensureUserId: jest.fn().mockResolvedValue(USER_ID),
          },
        },
        {
          provide: EstimationFormLocalDraftService,
          useValue: localDraftService,
        },
      ],
    }).compileComponents();
  });

  async function createComponent(): Promise<void> {
    fixture = TestBed.createComponent(EstimationForm);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
    await settleFixture(fixture);
  }

  it('should create', async () => {
    await createComponent();

    expect(component).toBeTruthy();
  });

  it('should load latest draft, sync route query param and restore server attachments', async () => {
    assessmentApi.findLatestDraft.mockResolvedValue(
      createDraftModel('assessment-42', {
        cityId: CITY_ID,
        districtId: DISTRICT_ID,
        address: 'Москва, Тверская ул., д. 10',
        cadastralNumber: '77:01:0004012:1234',
        area: '54.6',
        objectType: OBJECT_TYPE_VALUE,
        floorsTotal: '9',
        floor: '4',
        condition: CONDITION_VALUE,
        hasBalconyOrLoggia: true,
      }),
    );
    documentApi.listDocumentsByAssessment.mockResolvedValue([
      createStoredDocument('document-1', 'passport.pdf', 'document'),
      createStoredDocument('document-2', 'front.jpg', 'photo'),
    ]);

    await createComponent();

    expect(component.assessmentId()).toBe('assessment-42');
    expect(component.formControls.cityId.value).toBe(CITY_ID);
    expect(component.formControls.districtId.value).toBe(DISTRICT_ID);
    expect(component.formControls.address.value).toBe('Москва, Тверская ул., д. 10');
    expect(component.formControls.cadastralNumber.value).toBe('77:01:0004012:1234');
    expect(component.formControls.hasBalconyOrLoggia.value).toBe(true);
    expect(documentApi.listDocumentsByAssessment).toHaveBeenCalledWith('assessment-42');
    expect(component.uploadedDocumentItems()).toHaveLength(1);
    expect(component.uploadedPhotoItems()).toHaveLength(1);
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { assessmentId: 'assessment-42' },
      }),
    );
  });

  it('should save draft manually and clear local fallback after successful server save', async () => {
    await createComponent();
    fillCoreFields(component);

    await component.saveDraftManually();
    await settleFixture(fixture);

    expect(assessmentApi.createDraft).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        cityId: CITY_ID,
        address: 'Москва, Тверская ул., д. 10',
        cadastralNumber: '77:01:0004012:1234',
        area: '54.6',
        objectType: OBJECT_TYPE_VALUE,
      }),
    );
    expect(component.assessmentId()).toBe('assessment-1');
    expect(localDraftService.clear).toHaveBeenCalledWith(USER_ID);
  });

  it('should restore local fallback when server draft does not exist yet', async () => {
    localDraftService.load.mockReturnValue({
      assessmentId: null,
      updatedAt: '2026-04-02T10:00:00.000Z',
      form: {
        cityId: CITY_ID,
        districtId: DISTRICT_ID,
        address: 'Екатеринбург, ул. Малышева, д. 16',
        cadastralNumber: '66:41:0101021:37',
        area: '71.2',
        objectType: LAND_PLOT_TYPE_VALUE,
        rooms: '',
        floorsTotal: '',
        floor: '',
        condition: '',
        yearBuilt: '',
        wallMaterial: '',
        elevatorType: '',
        hasBalconyOrLoggia: false,
        landCategory: 'земли населённых пунктов',
        permittedUse: 'ИЖС',
        utilities: 'электричество',
        description: 'Видовой участок',
      },
    });

    await createComponent();

    expect(component.assessmentId()).toBeNull();
    expect(component.formControls.address.value).toBe('Екатеринбург, ул. Малышева, д. 16');
    expect(component.formControls.objectType.value).toBe(LAND_PLOT_TYPE_VALUE);
    expect(component.formControls.landCategory.value).toBe('земли населённых пунктов');
    expect(component.formControls.utilities.value).toBe('электричество');
  });

  it('should persist local fallback draft while the user edits the form before server save', async () => {
    await createComponent();
    fillCoreFields(component);
    await waitForMs(200);
    await settleFixture(fixture);

    expect(localDraftService.save).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        assessmentId: null,
        form: expect.objectContaining({
          cityId: CITY_ID,
          districtId: DISTRICT_ID,
          address: 'Москва, Тверская ул., д. 10',
          cadastralNumber: '77:01:0004012:1234',
          area: '54.6',
          objectType: OBJECT_TYPE_VALUE,
        }),
        updatedAt: expect.any(String),
      }),
    );
  });

  it('should refresh districts and reset district when the city changes', async () => {
    await createComponent();

    component.estimationForm.patchValue({
      cityId: CITY_ID,
      districtId: DISTRICT_ID,
    });
    await settleFixture(fixture);

    component.estimationForm.patchValue({
      cityId: OTHER_CITY_ID,
      districtId: DISTRICT_ID,
    });
    await settleFixture(fixture);

    expect(assessmentApi.listDistricts).toHaveBeenCalledWith(OTHER_CITY_ID);
    expect(component.formControls.districtId.value).toBe('');
    expect(component.districts()).toEqual([
      {
        id: OTHER_DISTRICT_ID,
        cityId: OTHER_CITY_ID,
        name: 'Ленинский',
      },
    ]);
  });

  it('should upload selected files immediately after assessment id appears', async () => {
    assessmentApi.findLatestDraft.mockResolvedValue(createDraftModel('assessment-9'));

    await createComponent();

    const inputElement = document.createElement('input');
    const selectedFile = createFile('passport.pdf', 'application/pdf');
    setInputFiles(inputElement, [selectedFile]);

    component.onFilesSelected(createFileSelectionEvent(inputElement), 'documents');
    await settleFixture(fixture);

    expect(documentApi.uploadDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        assessmentId: 'assessment-9',
        group: 'documents',
        file: selectedFile,
      }),
    );
    expect(component.documentFiles).toHaveLength(0);
  });

  it('should save draft, upload pending files and navigate to status page', async () => {
    await createComponent();
    fillRequiredFields(component);

    component.documentFiles = [createFile('passport.pdf', 'application/pdf')];
    component.photoFiles = [createFile('front.jpg', 'image/jpeg')];
    fixture.detectChanges();

    await component.onSubmit(new Event('submit'), getFormElement(fixture));
    await settleFixture(fixture);

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
  });

  it('should block submission when required documents are missing', async () => {
    await createComponent();
    fillRequiredFields(component);

    await component.onSubmit(new Event('submit'), getFormElement(fixture));

    expect(navigateSpy).not.toHaveBeenCalledWith(
      ['/applicant/assessment/status'],
      expect.anything(),
    );
    expect(assessmentApi.createDraft).not.toHaveBeenCalled();
    expect(component.validationErrorMessage).toContain('Сканы и документы');
  });
});

function createDraftModel(id: string, form: Partial<ReturnType<typeof createEmptyDraftForm>> = {}) {
  return {
    id,
    status: 1,
    form: {
      ...createEmptyDraftForm(),
      ...form,
    },
  };
}

function createEmptyDraftForm() {
  return {
    cityId: '',
    districtId: '',
    address: '',
    cadastralNumber: '',
    area: '',
    objectType: '',
    rooms: '',
    floorsTotal: '',
    floor: '',
    condition: '',
    yearBuilt: '',
    wallMaterial: '',
    elevatorType: '',
    hasBalconyOrLoggia: false,
    landCategory: '',
    permittedUse: '',
    utilities: '',
    description: '',
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

function fillCoreFields(component: EstimationForm): void {
  component.estimationForm.patchValue({
    cityId: CITY_ID,
    districtId: DISTRICT_ID,
    address: 'Москва, Тверская ул., д. 10',
    cadastralNumber: '77:01:0004012:1234',
    area: '54.6',
    objectType: OBJECT_TYPE_VALUE,
  });
}

function fillRequiredFields(component: EstimationForm): void {
  component.estimationForm.patchValue({
    cityId: CITY_ID,
    districtId: DISTRICT_ID,
    address: 'Москва, Тверская ул., д. 10',
    cadastralNumber: '77:01:0004012:1234',
    area: '54.6',
    objectType: OBJECT_TYPE_VALUE,
    floorsTotal: '9',
    condition: CONDITION_VALUE,
    confirmCorrect: true,
    confirmProcessing: true,
  });
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
  Object.defineProperty(inputElement, 'files', {
    configurable: true,
    value: files,
  });
}

async function settleFixture(fixture: ComponentFixture<EstimationForm>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

async function waitForMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
