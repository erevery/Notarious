import { Route } from '@angular/router';
import { Admin } from './admin/admin';

export const adminRoutes: Route[] = [
  {
    path: '',
    component: Admin,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin-dashboard/admin-dashboard').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'users',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/users/users-list/users-list').then(
                (m) => m.AdminUsersListComponent,
              ),
          } as Route,
          {
            path: ':id',
            loadComponent: () =>
              import('./features/users/user-detail/user-detail').then(
                (m) => m.AdminUserDetailComponent,
              ),
          } as Route,
        ],
      },
      {
        path: 'orders',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/orders/orders-list/orders-list').then(
                (m) => m.AdminOrdersListComponent,
              ),
          } as Route,
          {
            path: ':id',
            loadComponent: () =>
              import('./features/orders/order-detail/order-detail').then(
                (m) => m.AdminOrderDetailComponent,
              ),
          } as Route,
        ],
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/admin-payments/admin-payments').then((m) => m.AdminPaymentsComponent),
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('./features/admin-subscriptions/admin-subscriptions').then(
            (m) => m.AdminSubscriptionsComponent,
          ),
      },
      {
        path: 'plans',
        loadComponent: () => import('./features/plan/plan').then((m) => m.PlanComponent),
      } as Route,
      {
        path: 'discounts',
        loadComponent: () => import('./features/sale/sale').then((m) => m.SaleComponent),
      } as Route,
      {
        path: 'promocodes',
        loadComponent: () => import('./features/promo/promo').then((m) => m.PromoComponent),
      } as Route,
      {
        path: 'files',
        loadComponent: () =>
          import('./features/admin-files/admin-files').then((m) => m.AdminFilesComponent),
      },
      {
        path: 'newsletter',
        loadComponent: () =>
          import('./features/admin-newsletter/admin-newsletter').then(
            (m) => m.AdminNewsletterComponent,
          ),
      },
      {
        path: 'monitoring',
        loadComponent: () => import('./features/monitoring/monitoring').then((m) => m.Monitoring),
      } as Route,
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/admin-notifications/admin-notifications').then(
            (m) => m.AdminNotificationsComponent,
          ),
      },
      {
        path: 'statistics',
        loadComponent: () =>
          import('./features/admin-statistics/admin-statistics').then(
            (m) => m.AdminStatisticsComponent,
          ),
      },
      {
        path: 'geography',
        loadComponent: () => import('./features/geography/geography').then((m) => m.Geography),
      } as Route,
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin-settings/admin-settings').then((m) => m.AdminSettingsComponent),
      },
    ],
  },
];
