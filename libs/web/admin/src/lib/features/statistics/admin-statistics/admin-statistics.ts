import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssessmentQueueComponent } from '../assessment-queue/assessment-queue';
import { MetricsDashboardComponent } from '../metrics-dashboard/metrics-dashboard';

@Component({
  selector: 'app-admin-statistics',
  standalone: true,
  imports: [CommonModule, AssessmentQueueComponent, MetricsDashboardComponent],
  templateUrl: './admin-statistics.component.html',
  styleUrls: ['./admin-statistics.component.css'],
})
export class AdminStatisticsComponent {}
