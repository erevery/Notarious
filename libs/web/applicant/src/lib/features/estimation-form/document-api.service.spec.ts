import { TestBed } from '@angular/core/testing';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';
import { createClient } from '@connectrpc/connect';
import { DocumentType } from '@notary-portal/api-contracts';
import { RPC_TRANSPORT } from '@notary-portal/ui';
import { DocumentApiService } from './document-api.service';

jest.mock('@connectrpc/connect', () => ({
  createClient: jest.fn(),
}));

describe('DocumentApiService', () => {
  let service: DocumentApiService;
  let client: {
    listDocumentsByAssessment: jest.Mock;
    createDocument: jest.Mock;
    deleteDocument: jest.Mock;
  };

  const createClientMock = createClient as jest.MockedFunction<typeof createClient>;

  beforeEach(() => {
    client = {
      listDocumentsByAssessment: jest.fn(),
      createDocument: jest.fn(),
      deleteDocument: jest.fn(),
    };

    createClientMock.mockReset();
    createClientMock.mockReturnValue(client as never);

    TestBed.configureTestingModule({
      providers: [DocumentApiService, { provide: RPC_TRANSPORT, useValue: {} }],
    });

    service = TestBed.inject(DocumentApiService);
  });

  it('should load documents by assessment id and keep stored kinds separated', async () => {
    client.listDocumentsByAssessment.mockResolvedValue({
      documents: [
        createDocumentMessage({
          id: 'document-1',
          assessmentId: 'assessment-7',
          fileName: 'passport.pdf',
          fileType: 'application/pdf',
          documentType: DocumentType.OTHER,
          uploadedAt: timestampFromDate(new Date('2026-04-03T10:00:00.000Z')),
        }),
        createDocumentMessage({
          id: 'document-2',
          assessmentId: 'assessment-7',
          fileName: 'front.jpg',
          fileType: 'image/jpeg',
          documentType: DocumentType.PHOTO,
          uploadedAt: timestampFromDate(new Date('2026-04-03T10:05:00.000Z')),
        }),
        createDocumentMessage({
          id: 'document-3',
          assessmentId: 'assessment-7',
          fileName: 'plan.xlsx',
          fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          documentType: DocumentType.ADDITIONAL,
          uploadedAt: timestampFromDate(new Date('2026-04-03T10:10:00.000Z')),
        }),
      ],
    });

    const documents = await service.listDocumentsByAssessment('assessment-7');

    expect(client.listDocumentsByAssessment).toHaveBeenCalledWith({
      assessmentId: 'assessment-7',
      pagination: {
        page: 1,
        limit: 100,
      },
    });
    expect(documents).toEqual([
      {
        id: 'document-1',
        fileName: 'passport.pdf',
        fileType: 'application/pdf',
        filePath: '/uploads/document.pdf',
        previewUrl: 'http://localhost:3000/uploads/document.pdf',
        downloadUrl: 'http://localhost:3000/uploads/document.pdf',
        version: 1,
        uploadedAt: '2026-04-03T10:00:00.000Z',
        kind: 'document',
      },
      {
        id: 'document-2',
        fileName: 'front.jpg',
        fileType: 'image/jpeg',
        filePath: '/uploads/document.pdf',
        previewUrl: 'http://localhost:3000/uploads/document.pdf',
        downloadUrl: 'http://localhost:3000/uploads/document.pdf',
        version: 1,
        uploadedAt: '2026-04-03T10:05:00.000Z',
        kind: 'photo',
      },
      {
        id: 'document-3',
        fileName: 'plan.xlsx',
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filePath: '/uploads/document.pdf',
        previewUrl: 'http://localhost:3000/uploads/document.pdf',
        downloadUrl: 'http://localhost:3000/uploads/document.pdf',
        version: 1,
        uploadedAt: '2026-04-03T10:10:00.000Z',
        kind: 'additional',
      },
    ]);
  });

  it('should keep absolute stored file urls unchanged', async () => {
    client.listDocumentsByAssessment.mockResolvedValue({
      documents: [
        createDocumentMessage({
          filePath: 'https://cdn.example.com/uploads/front.jpg',
          fileType: 'image/jpeg',
          documentType: DocumentType.PHOTO,
        }),
      ],
    });

    const [document] = await service.listDocumentsByAssessment('assessment-7');

    expect(document.previewUrl).toBe('https://cdn.example.com/uploads/front.jpg');
    expect(document.downloadUrl).toBe('https://cdn.example.com/uploads/front.jpg');
  });

  it('should upload generic applicant documents bound to assessmentId', async () => {
    const file = createUploadFile('passport.pdf', 'application/pdf', 'passport');
    client.createDocument.mockResolvedValue({
      document: createDocumentMessage({
        assessmentId: 'assessment-7',
        fileName: 'passport.pdf',
        fileType: 'application/pdf',
        documentType: DocumentType.OTHER,
      }),
    });

    const document = await service.uploadDocument({
      assessmentId: 'assessment-7',
      file,
      group: 'documents',
    });

    const request = client.createDocument.mock.calls[0][0] as {
      assessmentId: string;
      fileContent: Uint8Array;
      documentType: DocumentType;
    };

    expect(request.assessmentId).toBe('assessment-7');
    expect(request.documentType).toBe(DocumentType.OTHER);
    expect(request.fileContent).toBeInstanceOf(Uint8Array);
    expect(Array.from(request.fileContent)).not.toHaveLength(0);
    expect(document.kind).toBe('document');
  });

  it('should upload photos with PHOTO document type for the same assessment', async () => {
    const file = createUploadFile('front.jpg', 'image/jpeg', 'photo');
    client.createDocument.mockResolvedValue({
      document: createDocumentMessage({
        assessmentId: 'assessment-7',
        fileName: 'front.jpg',
        fileType: 'image/jpeg',
        documentType: DocumentType.PHOTO,
      }),
    });

    const document = await service.uploadDocument({
      assessmentId: 'assessment-7',
      file,
      group: 'photos',
    });

    expect(client.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        assessmentId: 'assessment-7',
        fileName: 'front.jpg',
        documentType: DocumentType.PHOTO,
      }),
    );
    expect(document.kind).toBe('photo');
  });

  it('should upload additional files with ADDITIONAL document type', async () => {
    const file = createUploadFile(
      'plan.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'sheet',
    );
    client.createDocument.mockResolvedValue({
      document: createDocumentMessage({
        assessmentId: 'assessment-7',
        fileName: 'plan.xlsx',
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        documentType: DocumentType.ADDITIONAL,
      }),
    });

    const document = await service.uploadDocument({
      assessmentId: 'assessment-7',
      file,
      group: 'additional',
    });

    expect(client.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        assessmentId: 'assessment-7',
        fileName: 'plan.xlsx',
        documentType: DocumentType.ADDITIONAL,
      }),
    );
    expect(document.kind).toBe('additional');
  });

  it('should delete stored assessment documents by id', async () => {
    client.deleteDocument.mockResolvedValue({ success: true });

    await service.deleteDocument('document-7');

    expect(client.deleteDocument).toHaveBeenCalledWith({ id: 'document-7' });
  });
});

function createDocumentMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'document-1',
    assessmentId: 'assessment-1',
    fileName: 'document.pdf',
    fileType: 'application/pdf',
    filePath: '/uploads/document.pdf',
    previewUrl: 'http://localhost:3000/uploads/document.pdf',
    downloadUrl: 'http://localhost:3000/uploads/document.pdf',
    version: 1,
    uploadedAt: timestampFromDate(new Date('2026-04-03T10:00:00.000Z')),
    uploadedById: 'user-1',
    documentType: DocumentType.OTHER,
    ...overrides,
  };
}

function createUploadFile(name: string, type: string, content: string): File {
  const file = new File([content], name, { type });

  Object.defineProperty(file, 'arrayBuffer', {
    configurable: true,
    value: jest.fn().mockResolvedValue(new TextEncoder().encode(content).buffer),
  });

  return file;
}
