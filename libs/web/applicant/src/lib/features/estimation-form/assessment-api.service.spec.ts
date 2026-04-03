import { TestBed } from '@angular/core/testing';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';
import { createClient } from '@connectrpc/connect';
import {
  AssessmentStatus,
  ElevatorType,
  RealEstateCondition,
  RealEstateObjectType,
  WallMaterial,
} from '@notary-portal/api-contracts';
import { RPC_TRANSPORT } from '@notary-portal/ui';
import { AssessmentApiService } from './assessment-api.service';

jest.mock('@connectrpc/connect', () => ({
  createClient: jest.fn(),
}));

describe('AssessmentApiService', () => {
  let service: AssessmentApiService;
  let client: {
    getAssessment: jest.Mock;
    listAssessments: jest.Mock;
    createAssessment: jest.Mock;
    updateAssessment: jest.Mock;
    listCities: jest.Mock;
    listDistricts: jest.Mock;
  };

  const createClientMock = createClient as jest.MockedFunction<typeof createClient>;

  beforeEach(() => {
    client = {
      getAssessment: jest.fn(),
      listAssessments: jest.fn(),
      createAssessment: jest.fn(),
      updateAssessment: jest.fn(),
      listCities: jest.fn(),
      listDistricts: jest.fn(),
    };

    createClientMock.mockReset();
    createClientMock.mockReturnValue(client as never);

    TestBed.configureTestingModule({
      providers: [AssessmentApiService, { provide: RPC_TRANSPORT, useValue: {} }],
    });

    service = TestBed.inject(AssessmentApiService);
  });

  it('should map backend assessment object params to the frontend draft model', async () => {
    client.getAssessment.mockResolvedValue({
      assessment: createAssessmentMessage({
        address: 'Старый адрес из assessment',
        description: 'Описание assessment',
        realEstateObject: {
          cityId: 'city-1',
          districtId: 'district-1',
          address: 'Москва, Тверская ул., д. 10',
          cadastralNumber: '77:01:0004012:1234',
          area: '54.6',
          objectType: RealEstateObjectType.APARTMENT,
          roomsCount: 2,
          floorsTotal: 9,
          floor: 4,
          condition: RealEstateCondition.GOOD,
          yearBuilt: 2008,
          wallMaterial: WallMaterial.BRICK,
          elevatorType: ElevatorType.PASSENGER,
          hasBalconyOrLoggia: true,
          utilities: 'газ',
          description: 'Квартира после ремонта',
        },
      }),
    });

    const draft = await service.getAssessment('assessment-1');

    expect(client.getAssessment).toHaveBeenCalledWith({ id: 'assessment-1' });
    expect(draft).toEqual({
      id: 'assessment-1',
      status: AssessmentStatus.NEW,
      updatedAt: '2026-04-03T10:00:00.000Z',
      form: {
        cityId: 'city-1',
        districtId: 'district-1',
        address: 'Москва, Тверская ул., д. 10',
        cadastralNumber: '77:01:0004012:1234',
        area: '54.6',
        objectType: String(RealEstateObjectType.APARTMENT),
        rooms: '2',
        floorsTotal: '9',
        floor: '4',
        condition: String(RealEstateCondition.GOOD),
        yearBuilt: '2008',
        wallMaterial: String(WallMaterial.BRICK),
        elevatorType: String(ElevatorType.PASSENGER),
        hasBalconyOrLoggia: true,
        landCategory: '',
        permittedUse: '',
        utilities: 'газ',
        description: 'Квартира после ремонта',
      },
    });
  });

  it('should load the latest unfinished assessment for the applicant', async () => {
    client.listAssessments.mockResolvedValue({
      assessments: [
        createAssessmentMessage({
          id: 'assessment-7',
          address: 'Екатеринбург, ул. Малышева, д. 16',
          updatedAt: timestampFromDate(new Date('2026-04-03T10:20:00.000Z')),
          realEstateObject: {
            cityId: 'city-1',
            address: 'Екатеринбург, ул. Малышева, д. 16',
            area: '71.2',
            objectType: RealEstateObjectType.LAND_PLOT,
          },
        }),
      ],
    });

    const draft = await service.findLatestDraft('user-1');

    expect(client.listAssessments).toHaveBeenCalledWith({
      userId: 'user-1',
      statusFilter: AssessmentStatus.NEW,
      pagination: {
        page: 1,
        limit: 1,
      },
    });
    expect(draft).toEqual({
      id: 'assessment-7',
      status: AssessmentStatus.NEW,
      updatedAt: '2026-04-03T10:20:00.000Z',
      form: {
        cityId: 'city-1',
        districtId: '',
        address: 'Екатеринбург, ул. Малышева, д. 16',
        cadastralNumber: '',
        area: '71.2',
        objectType: String(RealEstateObjectType.LAND_PLOT),
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
      },
    });
  });

  it('should normalize object params before creating a draft', async () => {
    client.createAssessment.mockResolvedValue({
      assessment: createAssessmentMessage({
        realEstateObject: {
          cityId: 'city-1',
          address: 'Екатеринбург, ул. Малышева, д. 16',
          area: '71.2',
          objectType: RealEstateObjectType.LAND_PLOT,
        },
      }),
    });

    await service.createDraft('user-1', {
      cityId: ' city-1 ',
      districtId: '   ',
      address: ' Екатеринбург, ул. Малышева, д. 16 ',
      cadastralNumber: '  ',
      area: ' 71.2 ',
      objectType: String(RealEstateObjectType.LAND_PLOT),
      rooms: '',
      floorsTotal: '',
      floor: '',
      condition: '',
      yearBuilt: '',
      wallMaterial: '',
      elevatorType: '',
      hasBalconyOrLoggia: false,
      landCategory: ' земли населённых пунктов ',
      permittedUse: ' ИЖС ',
      utilities: ' электричество ',
      description: ' Участок у леса ',
    });

    expect(client.createAssessment).toHaveBeenCalledWith({
      userId: 'user-1',
      address: 'Екатеринбург, ул. Малышева, д. 16',
      description: 'Участок у леса',
      realEstateObject: {
        cityId: 'city-1',
        districtId: undefined,
        address: 'Екатеринбург, ул. Малышева, д. 16',
        cadastralNumber: '',
        area: '71.2',
        objectType: RealEstateObjectType.LAND_PLOT,
        roomsCount: undefined,
        floorsTotal: undefined,
        floor: undefined,
        condition: undefined,
        yearBuilt: undefined,
        wallMaterial: undefined,
        elevatorType: undefined,
        hasBalconyOrLoggia: false,
        landCategory: 'земли населённых пунктов',
        permittedUse: 'ИЖС',
        utilities: 'электричество',
        description: 'Участок у леса',
      },
    });
  });

  it('should request districts for the selected city', async () => {
    client.listDistricts.mockResolvedValue({
      districts: [{ id: 'district-1', cityId: 'city-1', name: 'Ленинский' }],
    });

    const districts = await service.listDistricts(' city-1 ');

    expect(client.listDistricts).toHaveBeenCalledWith({ cityId: 'city-1' });
    expect(districts).toEqual([{ id: 'district-1', cityId: 'city-1', name: 'Ленинский' }]);
  });
});

function createAssessmentMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'assessment-1',
    status: AssessmentStatus.NEW,
    address: 'Москва, Тверская ул., д. 10',
    description: '',
    updatedAt: timestampFromDate(new Date('2026-04-03T10:00:00.000Z')),
    ...overrides,
  };
}
