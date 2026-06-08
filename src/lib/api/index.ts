import apiClient from "./client";

/** Spring Data `Page` JSON shape returned by list endpoints */
export type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

function createResource<T>(base: string) {
  return {
    getAll: (params?: Record<string, unknown>) => apiClient.get<T[]>(base, { params }),
    getById: (id: string | number) => apiClient.get<T>(`${base}/${id}`),
    create: (data: Partial<T>) => apiClient.post<T>(base, data),
    update: (id: string | number, data: Partial<T>) => apiClient.put<T>(`${base}/${id}`, data),
    delete: (id: string | number) => apiClient.delete(`${base}/${id}`),
  };
}

function withListPage(base: string) {
  return {
    ...createResource<Record<string, unknown>>(base),
    listPage: (params?: Record<string, unknown>) =>
      apiClient.get<SpringPage<Record<string, unknown>>>(base, { params }),
  };
}

const rawMaterialsBase = "/raw-materials";
export const rawMaterialsApi = {
  ...createResource<Record<string, unknown>>(rawMaterialsBase),
  listPage: (params?: Record<string, unknown>) =>
    apiClient.get<SpringPage<Record<string, unknown>>>(rawMaterialsBase, { params }),
  purchaseOrdersPage: (params?: Record<string, unknown>) =>
    apiClient.get<SpringPage<Record<string, unknown>>>(`${rawMaterialsBase}/purchase-orders`, { params }),
  movementsPage: (materialId: string, params?: Record<string, unknown>) =>
    apiClient.get<SpringPage<Record<string, unknown>>>(`${rawMaterialsBase}/${materialId}/movements`, { params }),
  stockIn: (materialId: string, body: { quantity: number; notes?: string }) =>
    apiClient.post<Record<string, unknown>>(`${rawMaterialsBase}/${materialId}/stock-in`, body),
  stockOut: (materialId: string, body: { quantity: number; notes?: string }) =>
    apiClient.post<Record<string, unknown>>(`${rawMaterialsBase}/${materialId}/stock-out`, body),
  createPurchaseOrder: (body: Record<string, unknown>) =>
    apiClient.post<Record<string, unknown>>(`${rawMaterialsBase}/purchase-orders`, body),
  getPurchaseOrder: (id: string) => apiClient.get<Record<string, unknown>>(`${rawMaterialsBase}/purchase-orders/${id}`),
  receivePurchaseOrder: (id: string, body?: Record<string, unknown>) =>
    apiClient.put<Record<string, unknown>>(`${rawMaterialsBase}/purchase-orders/${id}/receive`, body ?? {}),
};

export const usersApi = withListPage("/users");
export const recipesApi = withListPage("/recipes");
const suppliersBase = "/suppliers";
export const suppliersApi = {
  ...withListPage(suppliersBase),
  communicationsPage: (supplierId: string, params?: Record<string, unknown>) =>
    apiClient.get<SpringPage<Record<string, unknown>>>(`${suppliersBase}/${supplierId}/communications`, { params }),
};
export const customersApi = withListPage("/customers");
const batchesBase = "/batches";
export const batchesApi = {
  ...withListPage(batchesBase),
  getById: (id: string) => apiClient.get<Record<string, unknown>>(`${batchesBase}/${id}`),
  create: (body: Record<string, unknown>) => apiClient.post<Record<string, unknown>>(batchesBase, body),
  confirmIngredients: (id: string) =>
    apiClient.post<Record<string, unknown>>(`${batchesBase}/${id}/confirm-ingredients`),
  start: (id: string) => apiClient.post<Record<string, unknown>>(`${batchesBase}/${id}/start`),
  recordYield: (id: string, body: Record<string, unknown>) =>
    apiClient.put<Record<string, unknown>>(`${batchesBase}/${id}/yield`, body),
  sendToQc: (id: string) => apiClient.post<Record<string, unknown>>(`${batchesBase}/${id}/send-to-qc`),
  syncFinishedGoods: () =>
    apiClient.post<{ transferred: number }>(`${batchesBase}/sync-finished-goods`),
};
export const ordersApi = withListPage("/orders");
export const qualityApi = {
  ...withListPage("/quality"),
  pending: (params?: Record<string, unknown>) =>
    apiClient.get<SpringPage<Record<string, unknown>>>("/quality/pending", { params }),
  trends: () => apiClient.get<Record<string, unknown>>("/quality/trends"),
};
export const finishedProductsApi = {
  ...withListPage("/finished-products"),
  transfer: (body: { batchId: string; lotNumber?: string }) =>
    apiClient.post<Record<string, unknown>>("/finished-products/transfer", body),
};
const notificationsBase = "/notifications";
export const notificationsApi = {
  ...withListPage(notificationsBase),
  unreadCount: () => apiClient.get<{ count: number }>(`${notificationsBase}/unread-count`),
  markAllRead: () => apiClient.put(`${notificationsBase}/read-all`),
};
const auditBase = "/audit";
export const auditApi = {
  ...withListPage(auditBase),
  anomaliesPage: (params?: Record<string, unknown>) =>
    apiClient.get<SpringPage<Record<string, unknown>>>(`${auditBase}/anomalies`, { params }),
  modulePage: (module: string, params?: Record<string, unknown>) =>
    apiClient.get<SpringPage<Record<string, unknown>>>(`${auditBase}/module/${encodeURIComponent(module)}`, { params }),
};

export const reportsApi = {
  production: (params?: Record<string, unknown>) =>
    apiClient.get<Record<string, unknown>>("/reports/production", { params }),
  quality: (params?: Record<string, unknown>) =>
    apiClient.get<Record<string, unknown>>("/reports/quality", { params }),
  rawInventory: (params?: Record<string, unknown>) =>
    apiClient.get<Record<string, unknown>>("/reports/inventory/raw-materials", { params }),
  finishedInventory: (params?: Record<string, unknown>) =>
    apiClient.get<Record<string, unknown>>("/reports/inventory/finished-goods", { params }),
  sales: (params?: Record<string, unknown>) =>
    apiClient.get<Record<string, unknown>>("/reports/sales", { params }),
  waste: (params?: Record<string, unknown>) =>
    apiClient.get<Record<string, unknown>>("/reports/waste", { params }),
  scheduledList: (params?: Record<string, unknown>) =>
    apiClient.get<SpringPage<Record<string, unknown>>>("/reports/scheduled", { params }),
};

export interface DashboardPayload {
  kpis: {
    totalProduction: number;
    totalQCTests: number;
    totalSales: number;
    inventoryValue: number;
    lowStockItems: number;
    qualityPassRate: number;
    pendingBatches: number;
  };
  recentActivity: Array<Record<string, unknown>>;
  charts: Record<string, unknown>;
}

export const dashboardApi = {
  getDashboard: () => apiClient.get<DashboardPayload>("/dashboard"),
};

export { authApi, type AuthMeResponse } from "./auth";
export { default as apiClient } from "./client";
