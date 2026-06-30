import apiClient from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  requiresMfa?: boolean;
  requiresPasswordChange?: boolean;
  tempToken?: string;
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

/** Matches GET /api/auth/me (UserSummaryResponse). */
export interface AuthMeResponse {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  employeeId?: string | null;
  department?: string | null;
  role: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/auth/login", data),

  register: (data: RegisterRequest) =>
    apiClient.post("/auth/register", data),

  verifyMfa: (data: { tempToken: string; mfaCode: string }) =>
    apiClient.post<LoginResponse>("/auth/verify-mfa", data),

  completeFirstLogin: (data: { tempToken: string; newPassword: string; confirmPassword: string }) =>
    apiClient.post<LoginResponse>("/auth/complete-first-login", data),

  me: () => apiClient.get<AuthMeResponse>("/auth/me"),

  updateMe: (data: { fullName: string; phone: string; department: string }) =>
    apiClient.put<AuthMeResponse>("/auth/me", data),

  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    apiClient.put<{ message: string }>("/auth/me/change-password", data),

  forgotPassword: (email: string) =>
    apiClient.post("/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; newPassword: string; confirmPassword: string }) =>
    apiClient.post("/auth/reset-password", data),

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      /* still clear session client-side */
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};
