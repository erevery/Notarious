import { FormsModule } from '@angular/forms';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AssessmentApiService } from './assessment-api.service';
import { DocumentApiService, type UploadGroup } from './document-api.service';
import {
  CONDITION_OPTIONS,
  ELEVATOR_TYPE_OPTIONS,
  INITIAL_ESTIMATION_FORM_VALUE,
  OBJECT_TYPE_OPTIONS,
  WALL_MATERIAL_OPTIONS,
  type AssessmentDocumentModel,
  type AssessmentDraftModel,
  type DistrictLookupOption,
  type EstimationFormDraftData,
  type EstimationFormValue,
  type LookupOption,
} from './estimation-form.models';
import { EstimationFormSessionService } from './estimation-form-session.service';

type RequiredUploadGroup = Exclude<UploadGroup, 'additional'>;
type FormControlElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type FileCategory = 'image' | 'pdf' | 'word' | 'spreadsheet' | 'other';

interface ImagePreviewState {
  fileKey: string;
  fileName: string;
  objectUrl: string;
}

const ASSESSMENT_ID_QUERY_PARAM = 'assessmentId';

@Component({
  selector: 'lib-estimation-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './estimation-form.html',
  styleUrl: './estimation-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstimationForm implements OnDestroy {
  readonly cities = signal<LookupOption[]>([]);
  readonly districts = signal<DistrictLookupOption[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly documentsError = signal<string | null>(null);
  readonly assessmentId = signal<string | null>(null);
  readonly storedDocuments = signal<AssessmentDocumentModel[]>([]);
  readonly uploadedDocumentItems = computed(() =>
    this.storedDocuments().filter((document) => document.kind === 'document'),
  );
  readonly uploadedPhotoItems = computed(() =>
    this.storedDocuments().filter((document) => document.kind === 'photo'),
  );
  readonly isBusy = computed(() => this.loading() || this.saving());
  readonly objectTypeOptions = OBJECT_TYPE_OPTIONS;
  readonly conditionOptions = CONDITION_OPTIONS;
  readonly wallMaterialOptions = WALL_MATERIAL_OPTIONS;
  readonly elevatorTypeOptions = ELEVATOR_TYPE_OPTIONS;

  showValidationErrors = false;
  validationErrorMessage = '';
  documentFiles: ReadonlyArray<File> = [];
  photoFiles: ReadonlyArray<File> = [];
  additionalFiles: ReadonlyArray<File> = [];
  imagePreviewState: ImagePreviewState | null = null;
  isConsentModalOpen = false;
  form: EstimationFormValue = { ...INITIAL_ESTIMATION_FORM_VALUE };

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly assessmentApi = inject(AssessmentApiService);
  private readonly documentApi = inject(DocumentApiService);
  private readonly sessionService = inject(EstimationFormSessionService);
  private readonly objectUrls = new Map<string, string>();
  private readonly allDistricts = signal<DistrictLookupOption[]>([]);

  constructor() {
    void this.initialize();
  }

  async onSubmit(event: Event, form: HTMLFormElement): Promise<void> {
    event.preventDefault();
    this.showValidationErrors = true;
    this.validationErrorMessage = '';
    this.saveError.set(null);

    const firstInvalidControl = form.querySelector<FormControlElement>(
      'input:invalid, select:invalid, textarea:invalid',
    );
    if (firstInvalidControl) {
      this.validationErrorMessage = this.buildValidationErrorMessage(form, firstInvalidControl);
      firstInvalidControl.focus();
      return;
    }

    const missingRequiredUploadGroup = this.getFirstMissingRequiredUploadGroup();
    if (missingRequiredUploadGroup) {
      this.validationErrorMessage = this.buildUploadValidationErrorMessage(
        missingRequiredUploadGroup,
      );
      this.focusUploadInput(form, missingRequiredUploadGroup);
      return;
    }

    this.saving.set(true);

    try {
      const assessment = await this.saveDraft();
      const uploadFailures = await this.uploadPendingFiles(assessment.id);

      await this.loadStoredDocuments(assessment.id);

      if (uploadFailures.length) {
        throw new Error(
          `Не удалось загрузить часть файлов: ${uploadFailures.slice(0, 3).join(', ')}`,
        );
      }

      await this.router.navigate(['/applicant/assessment/status'], {
        queryParams: {
          [ASSESSMENT_ID_QUERY_PARAM]: assessment.id,
        },
      });
    } catch (error) {
      console.error('Failed to save estimation form', error);
      this.saveError.set(
        extractErrorMessage(error, 'Не удалось сохранить параметры оценки. Попробуйте ещё раз.'),
      );
    } finally {
      this.saving.set(false);
    }
  }

  onCityChange(cityId: string): void {
    this.form.districtId = '';
    void this.loadDistrictsForCity(cityId);
  }

  onFilesSelected(event: Event, group: UploadGroup): void {
    const inputElement = event.target as HTMLInputElement;
    const selectedFiles = inputElement.files ? Array.from(inputElement.files) : [];
    if (!selectedFiles.length) {
      return;
    }

    const nextFiles = this.mergeFiles(this.getFiles(group), selectedFiles);
    this.setFiles(group, nextFiles);
    this.syncFileInput(inputElement, nextFiles);
  }

  removeFile(inputElement: HTMLInputElement, group: UploadGroup, fileIndex: number): void {
    const files = this.getFiles(group);
    const removedFile = files[fileIndex];
    const nextFiles = files.filter((_, index) => index !== fileIndex);

    if (removedFile) {
      this.closeImagePreviewIfOpen(removedFile);
      this.releaseObjectUrl(removedFile);
    }

    this.setFiles(group, nextFiles);
    this.syncFileInput(inputElement, nextFiles);
  }

  hasFiles(group: UploadGroup): boolean {
    if (this.getFiles(group).length > 0) {
      return true;
    }

    if (group === 'additional') {
      return false;
    }

    return this.getStoredDocuments(group).length > 0;
  }

  hasStoredDocuments(group: RequiredUploadGroup): boolean {
    return this.getStoredDocuments(group).length > 0;
  }

  isRequiredUploadMissing(group: RequiredUploadGroup): boolean {
    return !this.hasFiles(group);
  }

  formatFileSize(bytes: number): string {
    const kilobytes = bytes / 1024;
    if (kilobytes < 1024) {
      return `${kilobytes.toFixed(1)} КБ`;
    }

    const megabytes = kilobytes / 1024;
    return `${megabytes.toFixed(1)} МБ`;
  }

  formatFileCount(count: number): string {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastDigit === 1 && lastTwoDigits !== 11) {
      return `${count} файл`;
    }

    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
      return `${count} файла`;
    }

    return `${count} файлов`;
  }

  formatStoredDocumentMeta(document: AssessmentDocumentModel): string {
    const parts = [document.kind === 'photo' ? 'Фото' : 'Документ', `v${document.version}`];

    if (document.uploadedAt) {
      parts.push(new Date(document.uploadedAt).toLocaleString('ru-RU'));
    }

    return parts.join(' · ');
  }

  isImageFile(file: File): boolean {
    const extension = this.getFileExtension(file.name);
    return (
      file.type.startsWith('image/') ||
      ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'heif', 'svg'].includes(extension)
    );
  }

  canPreviewFile(file: File): boolean {
    return this.isImageFile(file) || this.isPdfFile(file);
  }

  canOpenFile(file: File): boolean {
    return !this.isImageFile(file);
  }

  getFileObjectUrl(file: File): string {
    return this.ensureObjectUrl(file) ?? '';
  }

  getFileCategoryLabel(file: File): string {
    const category = this.getFileCategory(file);
    if (category === 'image') {
      return 'Изображение';
    }

    if (category === 'pdf') {
      return 'PDF';
    }

    if (category === 'word') {
      return 'DOC';
    }

    if (category === 'spreadsheet') {
      return 'XLS';
    }

    const extension = this.getFileExtension(file.name);
    return extension ? extension.toUpperCase() : 'FILE';
  }

  previewFile(file: File): void {
    if (this.isImageFile(file)) {
      this.openImagePreview(file);
      return;
    }

    if (this.isPdfFile(file)) {
      this.openFileInBrowser(file);
    }
  }

  openFile(file: File): void {
    if (this.isImageFile(file)) {
      this.openImagePreview(file);
      return;
    }

    this.openFileInBrowser(file);
  }

  downloadFile(file: File): void {
    const objectUrl = this.ensureObjectUrl(file);
    if (!objectUrl || typeof document === 'undefined') {
      return;
    }

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = file.name;
    link.rel = 'noopener';
    link.click();
  }

  openImagePreview(file: File): void {
    const objectUrl = this.ensureObjectUrl(file);
    if (!objectUrl) {
      return;
    }

    this.closeConsentModal();
    this.imagePreviewState = {
      fileKey: this.buildFileKey(file),
      fileName: file.name,
      objectUrl,
    };
  }

  closeImagePreview(): void {
    this.imagePreviewState = null;
  }

  openConsentModal(): void {
    this.closeImagePreview();
    this.isConsentModalOpen = true;
  }

  closeConsentModal(): void {
    this.isConsentModalOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscapeKeydown(): void {
    this.closeImagePreview();
    this.closeConsentModal();
  }

  ngOnDestroy(): void {
    if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
      return;
    }

    for (const objectUrl of this.objectUrls.values()) {
      URL.revokeObjectURL(objectUrl);
    }

    this.objectUrls.clear();
  }

  private async initialize(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    this.documentsError.set(null);

    try {
      const [cities, districts] = await Promise.all([
        this.assessmentApi.listCities(),
        this.assessmentApi.listDistricts(),
      ]);

      this.cities.set(cities);
      this.allDistricts.set(districts);
      this.districts.set(districts);

      const routeAssessmentId =
        this.route.snapshot.queryParamMap.get(ASSESSMENT_ID_QUERY_PARAM)?.trim() ?? '';

      if (routeAssessmentId) {
        await this.loadDraftById(routeAssessmentId);
        return;
      }

      const userId = await this.requireUserId();
      const latestDraft = await this.assessmentApi.findLatestDraft(userId);

      if (!latestDraft) {
        return;
      }

      this.applyDraft(latestDraft);
      await this.syncAssessmentId(latestDraft.id);
      await this.loadDistrictsForCity(latestDraft.form.cityId, latestDraft.form.districtId);
      await this.loadStoredDocuments(latestDraft.id);
    } catch (error) {
      console.error('Failed to initialize estimation form', error);
      this.loadError.set(
        extractErrorMessage(error, 'Не удалось загрузить форму оценки. Проверьте backend.'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  private async loadDraftById(assessmentId: string): Promise<void> {
    const draft = await this.assessmentApi.getAssessment(assessmentId);
    this.applyDraft(draft);
    await this.loadDistrictsForCity(draft.form.cityId, draft.form.districtId);
    await this.loadStoredDocuments(draft.id);
  }

  private applyDraft(draft: AssessmentDraftModel): void {
    this.assessmentId.set(draft.id);
    this.form = {
      ...INITIAL_ESTIMATION_FORM_VALUE,
      ...draft.form,
    };
  }

  private async saveDraft(): Promise<AssessmentDraftModel> {
    const formData = this.toDraftData();
    const currentAssessmentId = this.assessmentId();

    const savedAssessment = currentAssessmentId
      ? await this.assessmentApi.updateDraft(currentAssessmentId, formData)
      : await this.assessmentApi.createDraft(await this.requireUserId(), formData);

    this.assessmentId.set(savedAssessment.id);
    await this.syncAssessmentId(savedAssessment.id);

    return savedAssessment;
  }

  private async loadDistrictsForCity(cityId: string, preferredDistrictId?: string): Promise<void> {
    if (!cityId.trim()) {
      this.districts.set(this.allDistricts());
      this.form.districtId = '';
      return;
    }

    const districts = await this.assessmentApi.listDistricts(cityId);
    this.districts.set(districts);

    const nextDistrictId = preferredDistrictId ?? this.form.districtId;
    if (nextDistrictId && districts.some((district) => district.id === nextDistrictId)) {
      this.form.districtId = nextDistrictId;
      return;
    }

    this.form.districtId = '';
  }

  private async loadStoredDocuments(assessmentId: string): Promise<void> {
    this.documentsError.set(null);

    try {
      const documents = await this.documentApi.listDocumentsByAssessment(assessmentId);
      this.storedDocuments.set(documents);
    } catch (error) {
      console.error('Failed to load documents for assessment', error);
      this.documentsError.set(
        extractErrorMessage(error, 'Не удалось загрузить список документов заявки.'),
      );
    }
  }

  private async uploadPendingFiles(assessmentId: string): Promise<string[]> {
    const failures = [
      ...(await this.uploadGroupFiles('documents', assessmentId)),
      ...(await this.uploadGroupFiles('photos', assessmentId)),
      ...(await this.uploadGroupFiles('additional', assessmentId)),
    ];

    this.syncAllUploadInputs();

    return failures;
  }

  private async uploadGroupFiles(group: UploadGroup, assessmentId: string): Promise<string[]> {
    const files = [...this.getFiles(group)];
    if (!files.length) {
      return [];
    }

    const results = await Promise.allSettled(
      files.map((file) =>
        this.documentApi.uploadDocument({
          assessmentId,
          file,
          group,
        }),
      ),
    );

    const uploadedFiles: File[] = [];
    const failedFiles: string[] = [];

    results.forEach((result, index) => {
      const file = files[index];

      if (result.status === 'fulfilled') {
        uploadedFiles.push(file);
        return;
      }

      failedFiles.push(file.name);
    });

    if (uploadedFiles.length) {
      this.removeUploadedPendingFiles(group, uploadedFiles);
    }

    return failedFiles;
  }

  private removeUploadedPendingFiles(group: UploadGroup, uploadedFiles: ReadonlyArray<File>): void {
    const uploadedFileKeys = new Set(uploadedFiles.map((file) => this.buildFileKey(file)));
    const remainingFiles = this.getFiles(group).filter((file) => {
      const wasUploaded = uploadedFileKeys.has(this.buildFileKey(file));
      if (wasUploaded) {
        this.closeImagePreviewIfOpen(file);
        this.releaseObjectUrl(file);
      }

      return !wasUploaded;
    });

    this.setFiles(group, remainingFiles);
  }

  private syncAllUploadInputs(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const documentInput = document.getElementById('documentFiles') as HTMLInputElement | null;
    const photoInput = document.getElementById('photoFiles') as HTMLInputElement | null;
    const additionalInput = document.getElementById('additionalFiles') as HTMLInputElement | null;

    if (documentInput) {
      this.syncFileInput(documentInput, this.documentFiles);
    }

    if (photoInput) {
      this.syncFileInput(photoInput, this.photoFiles);
    }

    if (additionalInput) {
      this.syncFileInput(additionalInput, this.additionalFiles);
    }
  }

  private async syncAssessmentId(assessmentId: string): Promise<void> {
    const currentRouteValue =
      this.route.snapshot.queryParamMap.get(ASSESSMENT_ID_QUERY_PARAM)?.trim() ?? '';

    if (currentRouteValue === assessmentId) {
      return;
    }

    await this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParamsHandling: 'merge',
      queryParams: {
        [ASSESSMENT_ID_QUERY_PARAM]: assessmentId,
      },
    });
  }

  private async requireUserId(): Promise<string> {
    try {
      return await this.sessionService.ensureUserId();
    } catch (error) {
      await this.router.navigateByUrl('/auth');
      throw error;
    }
  }

  private toDraftData(): EstimationFormDraftData {
    return {
      cityId: this.form.cityId,
      districtId: this.form.districtId,
      address: this.form.address,
      area: this.form.area,
      objectType: this.form.objectType,
      rooms: this.form.rooms,
      floorsTotal: this.form.floorsTotal,
      floor: this.form.floor,
      condition: this.form.condition,
      yearBuilt: this.form.yearBuilt,
      wallMaterial: this.form.wallMaterial,
      elevatorType: this.form.elevatorType,
      description: this.form.description,
    };
  }

  private buildValidationErrorMessage(form: HTMLFormElement, control: FormControlElement): string {
    const labelText = this.getControlLabel(form, control);
    const browserMessage = control.validationMessage;

    if (labelText) {
      return `${labelText}: ${browserMessage}`;
    }

    return browserMessage;
  }

  private getFiles(group: UploadGroup): ReadonlyArray<File> {
    if (group === 'documents') {
      return this.documentFiles;
    }

    if (group === 'photos') {
      return this.photoFiles;
    }

    return this.additionalFiles;
  }

  private getStoredDocuments(group: RequiredUploadGroup): ReadonlyArray<AssessmentDocumentModel> {
    return group === 'documents' ? this.uploadedDocumentItems() : this.uploadedPhotoItems();
  }

  private setFiles(group: UploadGroup, files: ReadonlyArray<File>): void {
    if (group === 'documents') {
      this.documentFiles = files;
      return;
    }

    if (group === 'photos') {
      this.photoFiles = files;
      return;
    }

    this.additionalFiles = files;
  }

  private mergeFiles(
    existingFiles: ReadonlyArray<File>,
    selectedFiles: ReadonlyArray<File>,
  ): ReadonlyArray<File> {
    const nextFiles = new Map<string, File>();

    for (const file of [...existingFiles, ...selectedFiles]) {
      nextFiles.set(this.buildFileKey(file), file);
    }

    return Array.from(nextFiles.values());
  }

  private getFirstMissingRequiredUploadGroup(): RequiredUploadGroup | null {
    if (!this.hasFiles('documents')) {
      return 'documents';
    }

    if (!this.hasFiles('photos')) {
      return 'photos';
    }

    return null;
  }

  private buildUploadValidationErrorMessage(group: RequiredUploadGroup): string {
    if (group === 'documents') {
      return 'Сканы и документы: загрузите хотя бы один документ или скан.';
    }

    return 'Фото объекта: загрузите хотя бы одно фото объекта.';
  }

  private focusUploadInput(form: HTMLFormElement, group: RequiredUploadGroup): void {
    const uploadInput = form.querySelector<HTMLInputElement>(`#${this.getUploadInputId(group)}`);
    uploadInput?.focus();
  }

  private syncFileInput(inputElement: HTMLInputElement, files: ReadonlyArray<File>): void {
    if (!files.length) {
      inputElement.value = '';
      return;
    }

    if (typeof DataTransfer === 'undefined') {
      return;
    }

    const dataTransfer = new DataTransfer();
    for (const file of files) {
      dataTransfer.items.add(file);
    }

    inputElement.files = dataTransfer.files;
  }

  private openFileInBrowser(file: File): void {
    const objectUrl = this.ensureObjectUrl(file);
    if (!objectUrl || typeof window === 'undefined') {
      return;
    }

    const previewWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer');
    if (!previewWindow) {
      this.downloadFile(file);
    }
  }

  private ensureObjectUrl(file: File): string | null {
    const fileKey = this.buildFileKey(file);
    const cachedUrl = this.objectUrls.get(fileKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      return null;
    }

    const objectUrl = URL.createObjectURL(file);
    this.objectUrls.set(fileKey, objectUrl);
    return objectUrl;
  }

  private releaseObjectUrl(file: File): void {
    const fileKey = this.buildFileKey(file);
    const objectUrl = this.objectUrls.get(fileKey);

    if (!objectUrl) {
      return;
    }

    if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(objectUrl);
    }

    this.objectUrls.delete(fileKey);
  }

  private closeImagePreviewIfOpen(file: File): void {
    if (this.imagePreviewState?.fileKey === this.buildFileKey(file)) {
      this.closeImagePreview();
    }
  }

  private getControlLabel(form: HTMLFormElement, control: FormControlElement): string {
    if (control.id) {
      const boundLabel = form.querySelector<HTMLLabelElement>(`label[for="${control.id}"]`);
      if (boundLabel) {
        return this.normalizeLabelText(boundLabel.textContent);
      }
    }

    const ariaLabel = control.getAttribute('aria-label');
    if (ariaLabel) {
      return this.normalizeLabelText(ariaLabel);
    }

    return this.normalizeLabelText(control.closest('label')?.textContent);
  }

  private normalizeLabelText(labelText: string | null | undefined): string {
    return labelText?.replace(/\*/g, '').replace(/\s+/g, ' ').trim() ?? '';
  }

  private getUploadInputId(group: RequiredUploadGroup): string {
    return group === 'documents' ? 'documentFiles' : 'photoFiles';
  }

  private buildFileKey(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  private getFileCategory(file: File): FileCategory {
    const extension = this.getFileExtension(file.name);

    if (this.isImageFile(file)) {
      return 'image';
    }

    if (this.isPdfFile(file)) {
      return 'pdf';
    }

    if (
      extension === 'doc' ||
      extension === 'docx' ||
      file.type.includes('word') ||
      file.type.includes('officedocument.wordprocessingml')
    ) {
      return 'word';
    }

    if (
      extension === 'xls' ||
      extension === 'xlsx' ||
      file.type.includes('sheet') ||
      file.type.includes('excel')
    ) {
      return 'spreadsheet';
    }

    return 'other';
  }

  private isPdfFile(file: File): boolean {
    return file.type === 'application/pdf' || this.getFileExtension(file.name) === 'pdf';
  }

  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() ?? '';
  }
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === 'object' && error) {
    const maybeError = error as { rawMessage?: unknown; message?: unknown };

    if (typeof maybeError.rawMessage === 'string' && maybeError.rawMessage.trim()) {
      return maybeError.rawMessage.trim();
    }

    if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
      return maybeError.message.trim();
    }
  }

  return fallback;
}
