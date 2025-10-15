// Prefer Nuxt runtimeConfig at runtime on the client, fallback to Vite env at build-time
const RUNTIME_PUBLIC_BASE =
  (typeof window !== "undefined" &&
    (window as any)?.__NUXT__?.config?.public?.apiBase) ||
  undefined;
const PUBLIC_API_BASE =
  RUNTIME_PUBLIC_BASE || import.meta.env.NUXT_PUBLIC_API_BASE || "";

export const API_CONFIG = {
  BASE_URL: PUBLIC_API_BASE,
  ENDPOINTS: {
    AUTH: "/api/v1/auth",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/api/v1/auth/forgot-password",
    REFRESH_TOKEN: "/refresh",
    LOGOUT: "/api/v1/auth/logout",
    VERIFY_OTP: "/api/v1/auth/verify-otp",
    RESEND_OTP: "/api/v1/auth/resend-otp",
    ME: "/api/v1/auth/me",
    CHAT: "/api/v1/chat",
  },
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
