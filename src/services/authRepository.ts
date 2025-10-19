import axios, { type AxiosInstance } from "axios";
import { API_CONFIG } from "~/config/api";
import { BaseRepository } from "./base";

export type RegisterPayload = {
  username: string;
  email: string;
  last_name: string;
  first_name: string;
  password: string;
  confirm_password: string;
};

export class AuthRepository extends BaseRepository<any, any> {
  private client: AxiosInstance;
  private retry: boolean = false;

  constructor() {
    const client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      headers: { "Content-Type": "application/json" },
    });

    // interceptor: luôn gắn access_token nếu có
    client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    client.interceptors.response.use(
      (response) => response, // pass nếu OK
      async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const requestUrl: string = originalRequest?.url || "";
        const isLoginRequest = requestUrl.includes(
          `${API_CONFIG.ENDPOINTS.AUTH}/login`
        );

        // Nếu lỗi 401 (Unauthorized) và chưa retry
        if (status === 401 && !originalRequest._retry) {
          // Tránh can thiệp vào luồng login: để component tự xử lý hiển thị lỗi
          if (isLoginRequest) {
            return Promise.reject(error);
          }
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem("refresh_token");
            if (!refreshToken) {
              throw new Error("No refresh token");
            }
            // gọi API refresh
            const res = await client
              .post(`${API_CONFIG.ENDPOINTS.AUTH}/refresh`, {
                refresh_token: refreshToken,
              })
              .then((res) => {
                const newAccessToken = res.data.data.access_token;

                localStorage.setItem("access_token", newAccessToken);
                // gắn lại header và retry request
                originalRequest.headers[
                  "Authorization"
                ] = `Bearer ${newAccessToken}`;
                return client(originalRequest);
              });
          } catch (refreshError) {
            // refresh thất bại → logout
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            // Nếu đang ở trang login thì không redirect nữa để không nuốt lỗi của component
            if (
              typeof window !== "undefined" &&
              window.location.pathname !== "/login"
            ) {
              window.location.href = "/login";
              return Promise.reject(refreshError);
            }
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );

    // Gọi constructor của BaseRepository (resource = 'auth')
    super(client, API_CONFIG.ENDPOINTS.AUTH);

    this.client = client;
  }

  async register(payload: RegisterPayload) {
    const response = await this.client.post(
      `${API_CONFIG.ENDPOINTS.AUTH}/register`,
      payload
    );
    return response.data;
  }

  async verifyOtpCreateAccount(payload: { email: string; otp_code: string }) {
    const url = `${API_CONFIG.ENDPOINTS.AUTH}/verify-otp`;
    const response = await this.client.post(url, payload);
    return response.data;
  }

  async verifyOtp(payload: { email: string; otp_code: string }) {
    const url = `${API_CONFIG.ENDPOINTS.AUTH}/forgot-password/verify`;
    const response = await this.client.post(url, payload);
    return response.data;
  }

  async resendOtpCreateAccount(payload: { email: string }) {
    const url = `${API_CONFIG.ENDPOINTS.AUTH}/resend-otp`;
    const response = await this.client.post(url, payload);
    return response.data;
  }

  async resendOtp(payload: { email: string }) {
    const url = `${API_CONFIG.ENDPOINTS.AUTH}/forgot-password/resend`;
    const response = await this.client.post(url, payload);
    return response.data;
  }

  async login(payload: { email: string; password: string }) {
    // const url = `${API_CONFIG.ENDPOINTS.AUTH}/login`

    const response = await this.client.post(
      `${API_CONFIG.ENDPOINTS.AUTH}/login`,
      payload
    );

    return response.data;
  }

  async logout(payload: { refresh_token: string }) {
    const response = await this.client.post(
      `${API_CONFIG.ENDPOINTS.AUTH}/logout`,
      payload
    );
    return response.data;
  }

  async forgotPassword(payload: { email: string }) {
    const response = await this.client.post(
      `${API_CONFIG.ENDPOINTS.FORGOT_PASSWORD}/request`,
      payload
    );
    return response.data;
  }

  async resetPassword(payload: {
    email: string;
    new_password: string;
    confirm_password: string;
    otp_code: string;
  }) {
    const response = await this.client.post(
      `${API_CONFIG.ENDPOINTS.AUTH}/forgot-password/reset`,
      payload
    );
    return response.data;
  }

  async refreshToken(payload: { refresh_token: string }) {
    const response = await this.client.post(
      `${API_CONFIG.ENDPOINTS.AUTH}/refresh`,
      payload
    );
    return response.data;
  }

  // Enhanced refresh token method with better error handling
  async refreshTokenWithRetry(): Promise<{
    access_token: string;
    refresh_token?: string;
  } | null> {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        console.warn("No refresh token available");
        return null;
      }

      const response = await this.client.post(
        `${API_CONFIG.ENDPOINTS.AUTH}/refresh`,
        { refresh_token: refreshToken }
      );

      const { access_token, refresh_token: newRefreshToken } =
        response.data?.data || {};

      if (!access_token) {
        throw new Error("No access token in response");
      }

      // Update tokens in localStorage
      localStorage.setItem("access_token", access_token);
      if (newRefreshToken) {
        localStorage.setItem("refresh_token", newRefreshToken);
      }

      return { access_token, refresh_token: newRefreshToken };
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Clear invalid tokens
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || localStorage.getItem("access_token");
    if (!tokenToCheck) return true;

    try {
      const payload = JSON.parse(atob(tokenToCheck.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp < now;
    } catch {
      return true;
    }
  }

  // Get valid token (refresh if needed)
  async getValidToken(): Promise<string | null> {
    const token = localStorage.getItem("access_token");
    if (!token) return null;

    if (this.isTokenExpired(token)) {
      const refreshResult = await this.refreshTokenWithRetry();
      return refreshResult?.access_token || null;
    }

    return token;
  }

  async me() {
    const response = await this.client.get(`${API_CONFIG.ENDPOINTS.ME}`);
    return response.data;
  }
}

export const authRepository = new AuthRepository();
