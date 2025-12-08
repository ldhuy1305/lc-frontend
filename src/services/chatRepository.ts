import axios, { type AxiosInstance } from "axios";
import { API_CONFIG } from "~/config/api";
import { useTokenManager } from "~/composables/useTokenManager";

export type Conversation = {
  id: string;
  title: string;
  created_at?: string;
  snippet?: string;
};

class ChatRepository {
  private client: AxiosInstance;
  private tokenManager = useTokenManager();

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

  async searchConversations(query: string, size = 20, cursor?: string): Promise<Conversation[]> {
    const params = new URLSearchParams({
      query,
      size: size.toString(),
    });
    if (cursor) params.append("cursor", cursor);

    const res = await this.client.get(`${API_CONFIG.ENDPOINTS.CHAT}/search?${params.toString()}`);

    // Map the specific search response format to Conversation type
    if (res.data?.data?.items) {
      return res.data.data.items.map((item: any) => ({
        id: item.session_id,
        title: item.session_title,
        created_at: item.created_at,
        snippet: item.message_content
      }));
    }

    return [];
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
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let isStreaming = true;

    try {
      // Get fresh token with refresh logic
      const token = await this.getValidToken();
      if (!token) {
        throw new Error("No valid access token found");
      }

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
        // Handle 401 with refresh token logic
        if (response.status === 401) {
          try {
            const newToken = await this.tokenManager.forceRefresh();
            if (newToken) {
              // Retry with new token
              const retryResponse = await fetch(url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${newToken}`,
                },
                body: JSON.stringify(payload),
              });

              if (retryResponse.ok) {
                // Continue with retry response
                return this.handleStreamResponse(
                  retryResponse,
                  onChunk,
                  onSessionInfo,
                  onComplete,
                  onError
                );
              }
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            this.clearTokens();
            throw new Error("Authentication failed. Please login again.");
          }
        }

        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Use default error message if parsing fails
        }

        throw new Error(errorMessage);
      }

      // Handle successful response
      return this.handleStreamResponse(
        response,
        onChunk,
        onSessionInfo,
        onComplete,
        onError
      );
    } catch (error) {
      console.error("Streaming error:", error);
      onError?.(error as Error);
    }
  }

  // Helper method to get valid token using token manager
  private async getValidToken(): Promise<string | null> {
    return await this.tokenManager.getValidToken();
  }

  // Helper method to clear tokens using token manager
  private clearTokens(): void {
    this.tokenManager.clearTokens();
  }

  // Helper method to handle stream response
  private async handleStreamResponse(
    response: Response,
    onChunk: (chunk: string) => void,
    onSessionInfo?: (sessionInfo: {
      session_id: string;
      title: string;
      created_at: string;
    }) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ) {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let isStreaming = true;

    try {
      const bodyReader = response.body?.getReader();
      if (!bodyReader) {
        throw new Error("No response body reader available");
      }
      reader = bodyReader;

      const decoder = new TextDecoder();
      let buffer = "";
      let isFirstChunk = true;
      let chunkCount = 0;
      const maxChunks = 10000; // Prevent infinite loops

      while (isStreaming && chunkCount < maxChunks) {
        try {
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
                  isStreaming = false;
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

                  if (parsed.content !== undefined) {
                    // Handle both string and number content
                    onChunk(String(parsed.content));
                  } else if (typeof parsed === "string") {
                    onChunk(parsed);
                  } else if (typeof parsed === "number") {
                    onChunk(String(parsed));
                  }
                } catch (parseError) {
                  // If not JSON, treat as plain text
                  onChunk(data);
                }
              } else {
                // Handle plain text streaming
                onChunk(line);
              }

              isFirstChunk = false;
              chunkCount++;
            } catch (parseError) {
              console.warn("Failed to parse chunk:", line, parseError);
            }
          }
        } catch (readError) {
          console.error("Error reading stream:", readError);
          throw new Error(`Stream reading error: ${readError}`);
        }
      }

      if (chunkCount >= maxChunks) {
        throw new Error("Stream too long, possible infinite loop");
      }
    } catch (error) {
      console.error("Streaming error:", error);
      onError?.(error as Error);
    } finally {
      // Cleanup reader
      if (reader) {
        try {
          await reader.cancel();
        } catch (cancelError) {
          console.warn("Error canceling reader:", cancelError);
        }
      }
      isStreaming = false;
    }
  }
}

export const chatRepository = new ChatRepository();
