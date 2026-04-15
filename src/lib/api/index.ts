import apiClient from "./client";

// Generic CRUD helpers per resource
function createResource<T>(base: string) {
  return {
    getAll: (params?: Record<string, unknown>) =>
      apiClient.get<T[]>(base, { params }),
    getById: (id: string | number) =>
      apiClient.get<T>(`${base}/${id}`),
    create: (data: Partial<T>) =>
      apiClient.post<T>(base, data),
    update: (id: string | number, data: Partial<T>) =>
      apiClient.put<T>(`${base}/${id}`, data),
    delete: (id: string | number) =>
      apiClient.delete(`${base}/${id}`),
  };
}

export const usersApi = createResource("/users");
export const rawMaterialsApi = createResource("/raw-materials");
export const finishedProductsApi = createResource("/finished-products");
export const recipesApi = createResource("/recipes");
export const qualityApi = createResource("/quality");
export const batchesApi = createResource("/batches");
export const ordersApi = createResource("/orders");
export const customersApi = createResource("/customers");
export const suppliersApi = createResource("/suppliers");
export const reportsApi = createResource("/reports");
export const notificationsApi = createResource("/notifications");
export const auditApi = createResource("/audit");

export const dashboardApi = {
  getSummary: (params?: Record<string, unknown>) =>
    apiClient.get("/dashboard", { params }),
};

export { authApi } from "./auth";
export { default as apiClient } from "./client";
