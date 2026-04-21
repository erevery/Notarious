import { Route } from '@angular/router';
import { Admin } from './admin/admin';
import { PlaceholderPageRoute } from '@notary-portal/ui';

const placeholder = (title: string, features: string[]): Partial<Route> => ({
  component: PlaceholderPageRoute,
  data: { title, features },
});

export const adminRoutes: Route[] = [
  {
    path: '',
    component: Admin,
    children: [
      { path: '', ...placeholder('Главное меню', ['Обзор панели администратора']) } as Route,
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
        ...placeholder('Платежи', [
          'Список платежей/транзакций',
          'Формы создания/редактирования',
          'Модальное окно удаления',
        ]),
      } as Route,
      {
        path: 'subscriptions',
        ...placeholder('Подписки', ['Просмотр списка подписок']),
      } as Route,
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
        ...placeholder('Модерация файлов', [
          'Модерация загруженных файлов',
          'Статусы «принято/на проверке»',
        ]),
      } as Route,
      {
        path: 'newsletter',
        ...placeholder('Рассылка', ['Список рассылки', 'Формирование рассылки email']),
      } as Route,
      {
        path: 'monitoring',
        loadComponent: () => import('./features/monitoring/monitoring').then((m) => m.Monitoring),
      },
      {
        path: 'notifications',
        ...placeholder('Уведомления', ['Управление уведомлениями']),
      } as Route,
      {
        path: 'statistics',
        ...placeholder('Статистика', ['Метрики (конверсия/время)', 'Отчёты', 'Выгрузки']),
      } as Route,
      {
        path: 'geography',
        loadComponent: () => import('./features/geography/geography').then((m) => m.Geography),
      },
      {
        path: 'settings',
        ...placeholder('Настройки', ['Конфигурация системы']),
      } as Route,
    ],
  },
];
