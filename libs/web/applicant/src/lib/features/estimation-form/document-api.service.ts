import { timestampDate } from '@bufbuild/protobuf/wkt';
import { createClient } from '@connectrpc/connect';
import { DocumentService, DocumentType, type Document } from '@notary-portal/api-contracts';
import { Injectable, inject } from '@angular/core';
import { RPC_TRANSPORT } from '@notary-portal/ui';
import type { AssessmentDocumentModel } from './estimation-form.models';

export type UploadGroup = 'documents' | 'photos' | 'additional';

@Injectable({ providedIn: 'root' })
export class DocumentApiService {
  private readonly client = createClient(DocumentService, inject(RPC_TRANSPORT));

  async listDocumentsByAssessment(assessmentId: string): Promise<AssessmentDocumentModel[]> {
    const response = await this.client.listDocumentsByAssessment({
      assessmentId,
      pagination: {
        page: 1,
        limit: 100,
      },
    });

    return response.documents.map((document) => this.toDocumentModel(document));
  }

  async uploadDocument(params: {
    assessmentId: string;
    file: File;
    group: UploadGroup;
  }): Promise<AssessmentDocumentModel> {
    const response = await this.client.createDocument({
      assessmentId: params.assessmentId,
      fileName: params.file.name,
      fileType: params.file.type || 'application/octet-stream',
      filePath: '',
      uploadedById: '',
      documentType: resolveDocumentType(params.group, params.file),
      fileContent: new Uint8Array(await params.file.arrayBuffer()),
    });

    if (!response.document) {
      throw new Error(`Backend did not return document metadata for file "${params.file.name}"`);
    }

    return this.toDocumentModel(response.document);
  }

  private toDocumentModel(document: Document): AssessmentDocumentModel {
    return {
      id: document.id,
      fileName: document.fileName,
      fileType: document.fileType,
      version: document.version,
      uploadedAt: document.uploadedAt ? timestampDate(document.uploadedAt).toISOString() : null,
      kind: document.documentType === DocumentType.PHOTO ? 'photo' : 'document',
    };
  }
}

function resolveDocumentType(group: UploadGroup, file: File): DocumentType {
  if (group === 'photos' || file.type.startsWith('image/')) {
    return DocumentType.PHOTO;
  }

  return DocumentType.OTHER;
}
