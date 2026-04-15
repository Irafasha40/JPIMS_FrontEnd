import apiClient from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  mfaRequired?: boolean;
  mfaToken?: string;
}

export interface RegisterRequest {
  fullName: string;
  employeeId: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  password: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/auth/login", data),

  register: (data: RegisterRequest) =>
    apiClient.post("/auth/register", data),

  verifyMfa: (data: { mfaToken: string; code: string }) =>
    apiClient.post<LoginResponse>("/auth/verify-mfa", data),

  me: () => apiClient.get("/auth/me"),

  forgotPassword: (email: string) =>
    apiClient.post("/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; password: string }) =>
    apiClient.post("/auth/reset-password", data),

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};
