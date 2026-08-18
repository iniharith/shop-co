export type DashboardWidgetId = 'overview' | 'designMetrics' | 'productionMetrics' | 'packagingMetrics' | 'staffActivity';

export interface DashboardWidget {
  id: DashboardWidgetId;
  allowedRoles: string[];
}

export const dashboardWidgets: DashboardWidget[] = [
  { id: 'overview', allowedRoles: ['sysadmin', 'admin', 'boss'] },
  { id: 'designMetrics', allowedRoles: ['sysadmin', 'admin', 'boss', 'designer'] },
  { id: 'productionMetrics', allowedRoles: ['sysadmin', 'admin', 'boss', 'production'] },
  { id: 'packagingMetrics', allowedRoles: ['sysadmin', 'admin', 'boss', 'packaging'] },
  { id: 'staffActivity', allowedRoles: ['sysadmin', 'admin', 'boss', 'designer', 'production', 'packaging'] },
];

export function getWidgetsForRole(role: string): DashboardWidgetId[] {
  return dashboardWidgets
    .filter(w => w.allowedRoles.includes(role))
    .map(w => w.id);
}
