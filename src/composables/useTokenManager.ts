import { ref, computed } from "vue";
import { authRepository } from "~/services/authRepository";

export const useTokenManager = () => {
  const isRefreshing = ref(false);
  const refreshPromise = ref<Promise<string | null> | null>(null);

  // Check if token is expired
  const isTokenExpired = (token?: string): boolean => {
    const tokenToCheck = token || localStorage.getItem("access_token");
    if (!tokenToCheck) return true;

    try {
      const payload = JSON.parse(atob(tokenToCheck.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp < now;
    } catch {
      return true;
    }
  };

  // Get valid token with automatic refresh
  const getValidToken = async (): Promise<string | null> => {
    const token = localStorage.getItem("access_token");
    if (!token) return null;

    // If token is not expired, return it
    if (!isTokenExpired(token)) {
      return token;
    }

    // If already refreshing, wait for the current refresh
    if (isRefreshing.value && refreshPromise.value) {
      return await refreshPromise.value;
    }

    // Start refresh process
    isRefreshing.value = true;
    refreshPromise.value = refreshToken();

    try {
      const result = await refreshPromise.value;
      return result;
    } finally {
      isRefreshing.value = false;
      refreshPromise.value = null;
    }
  };

  // Refresh token with retry logic
  const refreshToken = async (): Promise<string | null> => {
    try {
      const refreshTokenValue = localStorage.getItem("refresh_token");
      if (!refreshTokenValue) {
        console.warn("No refresh token available");
        clearTokens();
        return null;
      }

      const response = await authRepository.refreshToken({
        refresh_token: refreshTokenValue,
      });

      const { access_token, refresh_token: newRefreshToken } =
        response?.data || {};

      if (!access_token) {
        throw new Error("No access token in response");
      }

      // Update tokens in localStorage
      localStorage.setItem("access_token", access_token);
      if (newRefreshToken) {
        localStorage.setItem("refresh_token", newRefreshToken);
      }

      return access_token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      clearTokens();
      return null;
    }
  };

  // Clear all tokens
  const clearTokens = (): void => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    // Redirect to login if not already there
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }
  };

  // Check if user is authenticated
  const isAuthenticated = computed(() => {
    const token = localStorage.getItem("access_token");
    return !!token && !isTokenExpired(token);
  });

  // Get current token (without refresh)
  const getCurrentToken = (): string | null => {
    return localStorage.getItem("access_token");
  };

  // Force refresh token
  const forceRefresh = async (): Promise<string | null> => {
    isRefreshing.value = true;
    refreshPromise.value = refreshToken();

    try {
      const result = await refreshPromise.value;
      return result;
    } finally {
      isRefreshing.value = false;
      refreshPromise.value = null;
    }
  };

  return {
    isRefreshing: computed(() => isRefreshing.value),
    isAuthenticated,
    getValidToken,
    getCurrentToken,
    forceRefresh,
    clearTokens,
    isTokenExpired,
  };
};
