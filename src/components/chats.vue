<template>
  <section class="chat-container">
    <header class="chat-header">
      <div class="title">
        <div class="title-content">
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
          <LogoutIcon :size="16" />
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
            <UserIcon :size="20" />
          </div>
          <div v-else class="assistant-avatar">
            <RobotIcon :size="20" />
          </div>
        </div>
        <div class="message-content">
          <div
            class="bubble"
            v-if="
              msg.role === 'assistant' &&
              isWaitingForResponse &&
              msg.text === '' &&
              idx === messages.length - 1
            "
          >
            <div class="typing-indicator">
              <TypingDots />
              <div class="typing-text">AI đang suy nghĩ...</div>
            </div>
          </div>
          <div
            class="bubble"
            v-else-if="
              msg.role === 'assistant' &&
              isWaitingForResponse &&
              msg.text !== '' &&
              idx === messages.length - 1
            "
          >
            <div class="message-text">
              <MarkdownRenderer
                :key="`streaming-${idx}-${msg.text.length}`"
                :content="msg.text"
                :isStreaming="true"
                class="streaming-content"
              />
            </div>
            <div class="message-time">
              <span class="streaming-indicator">Đang nhập</span>
              <span class="streaming-dots">...</span>
            </div>
          </div>
          <div class="bubble" v-else>
            <div class="message-text">
              <MarkdownRenderer
                v-if="msg.role === 'assistant'"
                :key="`completed-${idx}`"
                :content="msg.text"
                :isStreaming="false"
              />
              <span v-else class="user-message">{{ msg.text }}</span>
            </div>
            <div class="message-time">{{ formatTime(new Date()) }}</div>
          </div>
        </div>
      </div>

      <div v-if="!loadingHistory && messages.length === 0" class="empty">
        <div class="empty-icon">
          <ChatIcon :size="64" />
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
          <SendIcon v-if="!isWaitingForResponse" :size="20" />
          <div v-else class="send-loading">
            <LoadingSpinner :size="20" />
          </div>
        </button>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { authRepository } from "~/services/authRepository";
import { chatRepository } from "~/services/chatRepository";
import LoadingSkeleton from "~/components/ui/LoadingSkeleton.vue";
import MarkdownRenderer from "~/components/ui/MarkdownRenderer.vue";
import {
  UserIcon,
  RobotIcon,
  LogoutIcon,
  SendIcon,
  ChatIcon,
  LoadingSpinner,
  TypingDots,
} from "~/assets/icons";

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

// Hệ thống lưu trữ draft text cho từng conversation
const saveDraftForConversation = (conversationId: string, text: string) => {
  if (conversationId) {
    localStorage.setItem(`draft_${conversationId}`, text);
  }
};

const loadDraftForConversation = (conversationId: string) => {
  if (conversationId) {
    const savedDraft = localStorage.getItem(`draft_${conversationId}`);
    return savedDraft || "";
  }
  return "";
};

const clearDraftForConversation = (conversationId: string) => {
  if (conversationId) {
    localStorage.removeItem(`draft_${conversationId}`);
  }
};

// Auto-save draft khi user nhập
let draftSaveTimer: NodeJS.Timeout | null = null;
watch(draft, (newValue) => {
  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer);
  }

  draftSaveTimer = setTimeout(() => {
    if (currentConversationId.value) {
      saveDraftForConversation(currentConversationId.value, newValue);
    }
  }, 500); // Debounce 500ms
});

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

  // Clear draft cho conversation hiện tại
  if (currentConversationId.value) {
    clearDraftForConversation(currentConversationId.value);
  }

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
      (chunk: string | number) => {
        // Convert chunk to string to handle both string and number
        const chunkStr = String(chunk);
        streamingText += chunkStr;
        // Cập nhật tin nhắn cuối cùng (assistant message)
        const lastMessage = messages.value[messages.value.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          lastMessage.text = streamingText;
          scrollToBottom();
        }
      },
      // onSessionInfo - nhận thông tin session từ chunk đầu tiên
      (sessionInfo: {
        session_id: string;
        title: string;
        created_at: string;
      }) => {
        newSessionId = sessionInfo.session_id;
        localStorage.setItem("current_conversation_id", newSessionId);
        currentConversationId.value = newSessionId;

        // Dispatch event để cập nhật sidebar với conversation mới
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("conversation:created", {
              detail: {
                session_id: sessionInfo.session_id,
                title: sessionInfo.title,
                created_at: sessionInfo.created_at,
              },
            })
          );
        }
      },
      // onComplete - hoàn thành streaming
      () => {
        isWaitingForResponse.value = false;
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
    // Load draft cho conversation hiện tại
    draft.value = loadDraftForConversation(currentId);
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
        // Lưu draft của conversation cũ
        if (oldId && draft.value.trim()) {
          saveDraftForConversation(oldId, draft.value);
        }

        currentConversationId.value = id;
        messages.value = [];

        // Load draft cho conversation mới
        draft.value = loadDraftForConversation(id);

        await loadHistoryIfAny();
        await scrollToBottom();
      }
    }, 100); // 100ms debounce
  };
  const onClearCache = () => {
    messages.value = [];
    draft.value = "";
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
    if (draftSaveTimer) {
      clearTimeout(draftSaveTimer);
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
  position: relative;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(8px);
}

.title-content {
  display: flex;
  align-items: center;
  gap: 12px;
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
  padding: 24px;
  background: #fafbfc;
  scroll-behavior: smooth;
}

.message {
  display: flex;
  margin-bottom: 24px;
  align-items: flex-start;
  gap: 12px;
  animation: messageSlideIn 0.3s ease-out;
}

.message.user {
  flex-direction: row-reverse;
}

.message.assistant {
  flex-direction: row;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  border-radius: 50%;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.assistant-avatar:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.bubble {
  padding: 16px 20px;
  border-radius: 18px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  max-width: 100%;
  word-wrap: break-word;
}

.bubble:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.message.user .bubble {
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  color: white;
  -webkit-text-fill-color: #ffffff;
  border-bottom-right-radius: 4px;
  margin-left: auto;
}

.message.assistant .bubble {
  background: #ffffff;
  color: #1e293b;
  -webkit-text-fill-color: #1e293b;
  border-bottom-left-radius: 4px;
  border: 1px solid #e5e7eb;
  margin-right: auto;
}

.message-text {
  line-height: 1.6;
  font-size: 15px;
  margin-bottom: 8px;
  color: inherit;
  -webkit-text-fill-color: currentColor; /* inherit into nested elements */
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
  padding: 24px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  position: sticky;
  bottom: 0;
  backdrop-filter: blur(8px);
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  max-width: 900px;
  margin: 0 auto;
  position: relative;
}

.message-input {
  flex: 1;
  padding: 16px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 24px;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1);
  background: #ffffff;
}

.message-input::placeholder {
  color: #9ca3af;
  font-weight: 400;
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
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
}

.send-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.send-btn:hover:not(:disabled)::before {
  left: 100%;
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

/* Typing and streaming indicators */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.typing-text {
  font-size: 13px;
  opacity: 0.8;
  font-style: italic;
  color: #6b7280;
}

.streaming-content {
  position: relative;
}

.streaming-content::after {
  content: "|";
  color: #3b82f6;
  animation: blink 1s infinite;
  font-weight: 100;
  margin-left: 2px;
}

.streaming-indicator {
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}

.streaming-dots {
  animation: dots 1.5s infinite;
  color: #3b82f6;
  font-weight: 500;
}

@keyframes dots {
  0%,
  20% {
    content: "";
  }
  40% {
    content: ".";
  }
  60% {
    content: "..";
  }
  80%,
  100% {
    content: "...";
  }
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

.user-message {
  white-space: pre-wrap;
  word-wrap: break-word;
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

/* removed theme overrides */

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
