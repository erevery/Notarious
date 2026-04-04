import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatusCount {
  status: string;
  count: number;
  percent: number;
  color: string;
}

class AssessmentService {
  async listAssessments(params: any) {
    return {
      assessments: [
        { id: '1', status: 'New' },
        { id: '2', status: 'InProgress' },
        { id: '3', status: 'Completed' },
        { id: '4', status: 'Completed' },
        { id: '5', status: 'Completed' },
        { id: '6', status: 'Cancelled' },
      ],
    };
  }
}

class UserService {
  async listUsers(params: any) {
    return { users: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }] };
  }
}

@Component({
  selector: 'app-metrics-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metrics-dashboard.component.html',
  styleUrls: ['./metrics-dashboard.component.css'],
})
export class MetricsDashboardComponent implements OnInit {
  private assessmentService = inject(AssessmentService);
  private userService = inject(UserService);

  allAssessments = signal<any[]>([]);
  totalAssessments = computed(() => this.allAssessments().length);
  completedCount = computed(
    () => this.allAssessments().filter((a) => a.status === 'Completed').length,
  );
  conversionRate = computed(() => {
    const total = this.totalAssessments();
    return total ? ((this.completedCount() / total) * 100).toFixed(1) : '0';
  });
  activeNotaries = signal<number>(0);
  avgProcessingTime = signal<number>(3.5);

  statusBreakdown = computed<StatusCount[]>(() => {
    const counts = new Map<string, number>();
    for (const a of this.allAssessments()) {
      counts.set(a.status, (counts.get(a.status) || 0) + 1);
    }
    const total = this.totalAssessments();
    const colors: Record<string, string> = {
      New: '#3b82f6',
      InProgress: '#f59e0b',
      Completed: '#10b981',
      Cancelled: '#ef4444',
    };
    return Array.from(counts.entries()).map(([status, count]) => ({
      status,
      count,
      percent: (count / total) * 100,
      color: colors[status] || '#94a3b8',
    }));
  });

  topNotariesMock = signal([
    { name: 'Анна Смирнова', completed: 24, avgTime: 2.1, rating: 4.9 },
    { name: 'Дмитрий Козлов', completed: 18, avgTime: 2.8, rating: 4.7 },
    { name: 'Елена Морозова', completed: 15, avgTime: 3.0, rating: 4.6 },
    { name: 'Павел Некрасов', completed: 12, avgTime: 3.2, rating: 4.5 },
  ]);

  async ngOnInit() {
    const assessmentsRes = await this.assessmentService.listAssessments({
      pagination: { limit: 200 },
    });
    this.allAssessments.set(assessmentsRes.assessments);

    const notariesRes = await this.userService.listUsers({ roleFilter: 'Notary' });
    this.activeNotaries.set(notariesRes.users.length);
  }
}
