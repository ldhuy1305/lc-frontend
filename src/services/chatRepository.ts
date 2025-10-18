import axios, { type AxiosInstance } from "axios";
import { API_CONFIG } from "~/config/api";

export type Conversation = {
  id: string;
  title: string;
  created_at?: string;
};

class ChatRepository {
  private client: AxiosInstance;

  constructor() {
    const client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      headers: { "Content-Type": "application/json" },
    });

    // Attach access token like in AuthRepository
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

    // Auto-refresh on 401 (same logic style as AuthRepository)
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem("refresh_token");
            if (!refreshToken) throw new Error("No refresh token");

            const res = await client.post(
              `${API_CONFIG.ENDPOINTS.AUTH}/refresh`,
              {
                refresh_token: refreshToken,
              }
            );

            const newAccessToken = res.data?.data?.access_token;
            if (!newAccessToken) throw new Error("No new access token");

            localStorage.setItem("access_token", newAccessToken);
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            return client(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
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

    this.client = client;
  }

  async listConversations() {
    const res = await this.client.get(`${API_CONFIG.ENDPOINTS.CHAT}/sessions`);
    return res.data?.data || [];
  }

  async createChat(payload: { message: string; session_id?: string }) {
    const res = await this.client.post(`${API_CONFIG.ENDPOINTS.CHAT}`, payload);
    return res.data;
  }

  async searchConversations(): Promise<Conversation[]> {
    // Placeholder: adjust endpoint if backend provides search query
    const res = await this.client.get(`${API_CONFIG.ENDPOINTS.CHAT}/search`);
    return res.data?.data || [];
  }

  async detailConversations(session_id: string) {
    const url = `${API_CONFIG.ENDPOINTS.CHAT}/sessions/${session_id}`;
    const response = await this.client.get(url);
    return response.data;
  }

  async createChatStream(
    payload: {
      message: string;
      session_id?: string;
    },
    onChunk: (chunk: string) => void,
    onSessionInfo?: (sessionInfo: {
      session_id: string;
      title: string;
      created_at: string;
    }) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ) {
    try {
      const token = localStorage.getItem("access_token");
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT}/stream`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;

          try {
            // Handle Server-Sent Events format
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                onComplete?.();
                return;
              }

              try {
                const parsed = JSON.parse(data);

                // Kiểm tra chunk đầu tiên chứa session info
                if (
                  isFirstChunk &&
                  parsed.session_id &&
                  parsed.title &&
                  parsed.created_at
                ) {
                  onSessionInfo?.({
                    session_id: parsed.session_id,
                    title: parsed.title,
                    created_at: parsed.created_at,
                  });
                  isFirstChunk = false;
                  continue; // Không gọi onChunk cho chunk session info
                }

                if (parsed.content) {
                  onChunk(parsed.content);
                } else if (typeof parsed === "string") {
                  onChunk(parsed);
                }
              } catch {
                // If not JSON, treat as plain text
                onChunk(data);
              }
            } else {
              // Handle plain text streaming
              onChunk(line);
            }

            isFirstChunk = false;
          } catch (parseError) {
            console.warn("Failed to parse chunk:", line, parseError);
          }
        }
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }
}

export const chatRepository = new ChatRepository();
