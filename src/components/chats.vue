<template>
  <section class="chat-container">
    <header class="chat-header">
      <div class="title">
        <div class="title-content">
          <div class="chat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div class="title-text">
            <strong>Trò chuyện với AI</strong>
            <span v-if="currentConversationId" class="cid"
              >ID: {{ currentConversationId.slice(0, 8) }}...</span
            >
          </div>
        </div>
      </div>
      <div class="header-actions">
        <button class="logout-btn" @click="handleLogout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z"
              fill="currentColor"
            />
          </svg>
          Đăng xuất
        </button>
      </div>
    </header>

    <div ref="messagesEl" class="messages">
      <!-- Loading history skeleton -->
      <div v-if="loadingHistory" class="history-loading">
        <LoadingSkeleton
          v-for="n in 3"
          :key="`history-${n}`"
          variant="chat"
          size="medium"
        />
      </div>

      <!-- Messages -->
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        :class="['message', msg.role]"
      >
        <div class="avatar">
          <div v-if="msg.role === 'user'" class="user-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div v-else class="assistant-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
        <div class="message-content">
          <div
            class="bubble"
            v-if="
              msg.role === 'assistant' &&
              isWaitingForResponse &&
              msg.text === ''
            "
          >
            <div class="typing-indicator">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
            <div class="typing-text">AI đang trả lời...</div>
          </div>
          <div
            class="bubble"
            v-else-if="
              msg.role === 'assistant' &&
              isWaitingForResponse &&
              msg.text !== ''
            "
          >
            <div class="message-text">
              {{ msg.text }}<span class="cursor">|</span>
            </div>
            <div class="message-time">Đang nhập...</div>
          </div>
          <div class="bubble" v-else>
            <div class="message-text">{{ msg.text }}</div>
            <div class="message-time">{{ formatTime(new Date()) }}</div>
          </div>
        </div>
      </div>

      <div v-if="!loadingHistory && messages.length === 0" class="empty">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h3>Chào mừng bạn đến với AI Law Consultant!</h3>
        <p>
          Hãy đặt câu hỏi về pháp luật và tôi sẽ hỗ trợ bạn một cách tốt nhất.
        </p>
        <div class="suggestions">
          <div
            class="suggestion-item"
            @click="setSuggestion('Luật lao động có những quy định gì?')"
          >
            Luật lao động có những quy định gì?
          </div>
          <div
            class="suggestion-item"
            @click="setSuggestion('Quy trình khởi kiện như thế nào?')"
          >
            Quy trình khởi kiện như thế nào?
          </div>
          <div
            class="suggestion-item"
            @click="setSuggestion('Hợp đồng lao động có hiệu lực bao lâu?')"
          >
            Hợp đồng lao động có hiệu lực bao lâu?
          </div>
        </div>
      </div>
    </div>

    <footer class="input-bar">
      <div class="input-container">
        <textarea
          v-model="draft"
          @keydown="handleKeydown"
          placeholder="Nhập câu hỏi về pháp luật..."
          ref="textareaEl"
          class="message-input"
        ></textarea>
        <button
          @click="send"
          :disabled="isWaitingForResponse || !draft.trim()"
          class="send-btn"
        >
          <svg
            v-if="!isWaitingForResponse"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
              fill="currentColor"
            />
          </svg>
          <div v-else class="send-loading">
            <div class="loading-spinner"></div>
          </div>
        </button>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { authRepository } from "~/services/authRepository";
import { chatRepository } from "~/services/chatRepository";
import LoadingSkeleton from "~/components/ui/LoadingSkeleton.vue";

type ChatMessage = { role: "user" | "assistant"; text: string };

const currentConversationId = ref<string>("");
const messages = ref<ChatMessage[]>([]);
const draft = ref<string>("");
const messagesEl = ref<HTMLDivElement | null>(null);
const textareaEl = ref<HTMLTextAreaElement | null>(null);
const isWaitingForResponse = ref<boolean>(false);
const loadingHistory = ref<boolean>(false);
let debounceTimer: NodeJS.Timeout | null = null;

const loadConversationContext = () => {
  const cid = localStorage.getItem("current_conversation_id") || "";
  currentConversationId.value = cid;
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesEl.value) {
    (messagesEl.value as HTMLDivElement).scrollTop = (
      messagesEl.value as HTMLDivElement
    ).scrollHeight;
  }
};

const adjustTextareaHeight = () => {
  if (textareaEl.value) {
    textareaEl.value.style.height = "auto";
    const scrollHeight = textareaEl.value.scrollHeight;
    const buttonHeight = 52; // Match button height (52px)
    const maxHeight = 120; // 120px max height
    const minHeight = buttonHeight; // Start with button height

    // Only expand if content exceeds button height
    if (scrollHeight > buttonHeight) {
      const newHeight = Math.min(scrollHeight, maxHeight);
      textareaEl.value.style.height = newHeight + "px";

      // Enable scroll only when content exceeds max height
      if (scrollHeight > maxHeight) {
        textareaEl.value.style.overflowY = "auto";
      } else {
        textareaEl.value.style.overflowY = "hidden";
      }
    } else {
      textareaEl.value.style.height = minHeight + "px";
      textareaEl.value.style.overflowY = "hidden";
    }
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  } else {
    // Auto-resize on other keys
    nextTick(() => {
      adjustTextareaHeight();
    });
  }
};

const loadHistoryIfAny = async () => {
  const cid = currentConversationId.value;
  if (!cid) {
    messages.value = [];
    return;
  }

  loadingHistory.value = true;
  try {
    const data = await chatRepository.detailConversations(cid);
    const items: Array<{ role?: string; content?: string }> =
      (data as any)?.items || (data as any)?.data?.items || [];
    messages.value = items.map((it) => ({
      role: it && it.role === "assistant" ? "assistant" : "user",
      text: it && it.content ? it.content : "",
    }));
    await scrollToBottom();
  } catch (e) {
    const raw: any = (e as any)?.response?.data;
    const errMsg =
      typeof raw === "string"
        ? raw
        : raw?.detail ||
          raw?.message ||
          raw?.error ||
          (e as any)?.message ||
          "Không thể tải lịch sử trò chuyện";
    messages.value = [{ role: "assistant", text: String(errMsg) }];
  } finally {
    loadingHistory.value = false;
  }
};

const send = async () => {
  const text = draft.value.trim();
  if (!text || isWaitingForResponse.value) return;

  messages.value.push({ role: "user", text });
  draft.value = "";
  // Reset textarea height after sending
  if (textareaEl.value) {
    textareaEl.value.style.height = "auto";
  }
  await scrollToBottom();

  // Add streaming message placeholder
  messages.value.push({ role: "assistant", text: "" });
  isWaitingForResponse.value = true;
  await scrollToBottom();

  try {
    const existingSessionId =
      localStorage.getItem("current_conversation_id") || "";
    const payload = existingSessionId
      ? { message: text, session_id: existingSessionId }
      : { message: text };

    let newSessionId = existingSessionId;
    let streamingText = "";

    await chatRepository.createChatStream(
      payload,
      // onChunk - nhận từng chunk dữ liệu
      (chunk: string) => {
        streamingText += chunk;
        // Cập nhật tin nhắn cuối cùng (assistant message)
        const lastMessage = messages.value[messages.value.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          lastMessage.text = streamingText;
          scrollToBottom();
        }
      },
      // onComplete - hoàn thành streaming
      () => {
        isWaitingForResponse.value = false;
        // Lưu session_id nếu có (có thể được trả về trong chunk cuối)
        if (!existingSessionId && newSessionId) {
          localStorage.setItem("current_conversation_id", newSessionId);
          currentConversationId.value = newSessionId;
        }
      },
      // onError - xử lý lỗi
      (error: Error) => {
        isWaitingForResponse.value = false;
        // Thay thế tin nhắn streaming bằng lỗi
        const lastMessage = messages.value[messages.value.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          lastMessage.text = `Lỗi: ${error.message}`;
        }
        scrollToBottom();
      }
    );
  } catch (e) {
    isWaitingForResponse.value = false;
    // Thay thế tin nhắn streaming bằng lỗi
    const lastMessage = messages.value[messages.value.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      lastMessage.text = `Lỗi: ${(e as Error).message}`;
    }
    await scrollToBottom();
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const setSuggestion = (text: string) => {
  draft.value = text;
  if (textareaEl.value) {
    textareaEl.value.focus();
    adjustTextareaHeight();
  }
};

const handleLogout = async () => {
  try {
    const refreshToken = localStorage.getItem("refresh_token") || "";
    if (refreshToken) {
      await authRepository.logout({ refresh_token: refreshToken });
    }
  } catch (e) {
    // best-effort logout; still proceed to clear client state
  } finally {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.clear();
    } catch (e2) {}
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
};

onMounted(async () => {
  loadConversationContext();

  const currentId = localStorage.getItem("current_conversation_id");
  if (currentId) {
    await loadHistoryIfAny();
    await scrollToBottom();
  }

  const onSelected = async (e: any) => {
    const id =
      e?.detail?.id || localStorage.getItem("current_conversation_id") || "";

    // Clear debounce timer nếu có
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Debounce để tránh gọi API nhiều lần liên tiếp
    debounceTimer = setTimeout(async () => {
      const oldId = currentConversationId.value;

      // Chỉ load nếu conversation ID thay đổi
      if (oldId !== id) {
        currentConversationId.value = id;
        messages.value = [];
        await loadHistoryIfAny();
        await scrollToBottom();
      }
    }, 100); // 100ms debounce
  };
  const onClearCache = () => {
    messages.value = [];
  };

  window.addEventListener("conversation:selected", onSelected);
  window.addEventListener("conversation:clear-cache", onClearCache);

  // cleanup
  onBeforeUnmount(() => {
    window.removeEventListener("conversation:selected", onSelected);
    window.removeEventListener("conversation:clear-cache", onClearCache);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });
});
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #ffffff;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.title-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  border-radius: 12px;
  color: white;
}

.title-text strong {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  display: block;
}

.cid {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 400;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #ffffff;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #f1f5f9;
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-1px);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
}

.message {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-end;
  gap: 12px;
}

.message.user {
  flex-direction: row-reverse;
}

.message.assistant {
  flex-direction: row;
}

.avatar {
  flex-shrink: 0;
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  border-radius: 50%;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.assistant-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.bubble {
  padding: 16px 20px;
  border-radius: 20px;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.message.user .bubble {
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  color: white;
  border-bottom-right-radius: 6px;
}

.message.assistant .bubble {
  background: #ffffff;
  color: #1e293b;
  border-bottom-left-radius: 6px;
  border: 1px solid #e2e8f0;
}

.message-text {
  line-height: 1.6;
  font-size: 15px;
  margin-bottom: 8px;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  text-align: right;
}

.message.assistant .message-time {
  text-align: left;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.empty-icon {
  margin-bottom: 24px;
  opacity: 0.8;
}

.empty h3 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1e293b;
}

.empty p {
  font-size: 16px;
  margin-bottom: 32px;
  color: #64748b;
  max-width: 400px;
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  width: 100%;
}

.suggestion-item {
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  text-align: left;
  color: #1e293b;
}

.suggestion-item:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.input-bar {
  padding: 20px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  max-width: 800px;
  margin: 0 auto;
}

.message-input {
  flex: 1;
  padding: 16px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 25px;
  resize: none;
  height: 52px;
  max-height: 120px;
  overflow-y: hidden;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.5;
  background: #ffffff;
  transition: all 0.3s ease;
  color: #1e293b;
}

.message-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  background: #ffffff;
}

.message-input::placeholder {
  color: #9ca3af;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.send-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.send-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.typing-text {
  font-size: 13px;
  opacity: 0.8;
  font-style: italic;
}

.cursor {
  animation: blink 1s infinite;
  font-weight: 100;
  color: #3b82f6;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

.dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: dotPulse 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

.dot:nth-child(3) {
  animation-delay: 0s;
}

.history-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

/* Scrollbar styling */
.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.messages::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

@keyframes dotPulse {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .chat-header {
    padding: 12px 16px;
  }

  .messages {
    padding: 16px;
  }

  .input-bar {
    padding: 16px;
  }

  .message-content {
    max-width: 85%;
  }

  .empty h3 {
    font-size: 20px;
  }

  .empty p {
    font-size: 14px;
  }
}
</style>
