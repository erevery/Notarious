import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Assessment {
  id: string;
  address: string;
  propertyType: string;
  submissionDate: string;
  status: string;
}

interface Notary {
  id: string;
  fullName: string;
}

class AssessmentService {
  async listAssessments(params: any) {
    return {
      assessments: [
        {
          id: '1',
          address: 'г. Москва, ул. Тверская, д. 15',
          propertyType: 'Квартира',
          submissionDate: new Date(Date.now() - 5 * 3600000).toISOString(),
          status: 'New',
        },
        {
          id: '2',
          address: 'г. Санкт-Петербург, Невский пр., д. 25',
          propertyType: 'Дом',
          submissionDate: new Date(Date.now() - 20 * 3600000).toISOString(),
          status: 'New',
        },
        {
          id: '3',
          address: 'г. Казань, ул. Баумана, д. 10',
          propertyType: 'Земельный участок',
          submissionDate: new Date(Date.now() - 30 * 3600000).toISOString(),
          status: 'New',
        },
      ],
      meta: { totalItems: 3 },
    };
  }

  async verifyAssessment(params: { id: string; notaryId: string }) {
    console.log('Назначен нотариус:', params);
    return { success: true };
  }

  async cancelAssessment(params: { id: string; reason: string }) {
    console.log('Отклонена заявка:', params);
    return { success: true };
  }
}

class UserService {
  async listUsers(params: any) {
    return {
      users: [
        { id: '1', fullName: 'Иванова Анна Сергеевна' },
        { id: '2', fullName: 'Петров Дмитрий Владимирович' },
        { id: '3', fullName: 'Сидорова Елена Александровна' },
      ],
    };
  }
}

@Component({
  selector: 'app-assessment-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './assessment-queue.component.html',
  styleUrls: ['./assessment-queue.component.css'],
})
export class AssessmentQueueComponent {
  private assessmentService = inject(AssessmentService);
  private userService = inject(UserService);

  queueItems = signal<Assessment[]>([]);
  page = signal<number>(1);
  totalItems = signal<number>(0);
  limit = 10;

  showAssignDialog = signal(false);
  showRejectDialog = signal(false);
  selectedAssessment = signal<Assessment | null>(null);
  notariesList = signal<Notary[]>([]);
  selectedNotaryId = signal<string>('');
  rejectReason = signal<string>('');

  totalPages = computed(() => Math.ceil(this.totalItems() / this.limit));

  constructor() {
    this.loadQueue();
  }

  async loadQueue() {
    try {
      const result = await this.assessmentService.listAssessments({
        filters: { status: 'New' },
        pagination: { page: this.page(), limit: this.limit },
      });
      this.queueItems.set(result.assessments);
      this.totalItems.set(result.meta.totalItems);
    } catch (e) {
      console.error(e);
    }
  }

  getWaitingHours(assessment: Assessment): number {
    const hoursDiff = (Date.now() - new Date(assessment.submissionDate).getTime()) / (1000 * 3600);
    return Math.floor(hoursDiff);
  }

  getWaitingClass(assessment: Assessment): string {
    const hours = this.getWaitingHours(assessment);
    if (hours > 24) return 'waiting-red';
    if (hours > 12) return 'waiting-yellow';
    return '';
  }

  async openAssignModal(assessment: Assessment) {
    this.selectedAssessment.set(assessment);
    const result = await this.userService.listUsers({ roleFilter: 'Notary' });
    this.notariesList.set(result.users);
    this.showAssignDialog.set(true);
  }

  async confirmAssign() {
    const assessment = this.selectedAssessment();
    if (!assessment) return;
    await this.assessmentService.verifyAssessment({
      id: assessment.id,
      notaryId: this.selectedNotaryId(),
    });
    this.closeAssignDialog();
    this.loadQueue();
  }

  closeAssignDialog() {
    this.showAssignDialog.set(false);
    this.selectedAssessment.set(null);
    this.selectedNotaryId.set('');
  }

  openRejectModal(assessment: Assessment) {
    this.selectedAssessment.set(assessment);
    this.showRejectDialog.set(true);
  }

  async confirmReject() {
    const assessment = this.selectedAssessment();
    if (!assessment) return;
    await this.assessmentService.cancelAssessment({
      id: assessment.id,
      reason: this.rejectReason(),
    });
    this.closeRejectDialog();
    this.loadQueue();
  }

  closeRejectDialog() {
    this.showRejectDialog.set(false);
    this.selectedAssessment.set(null);
    this.rejectReason.set('');
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadQueue();
    }
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadQueue();
    }
  }
}
