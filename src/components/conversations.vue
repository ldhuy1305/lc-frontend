<template>
  <aside :class="['conversations', { collapsed }]">
    <div class="header">
      <div class="brand" v-if="!collapsed">
        <div class="brand-text">
          <strong>Law Consultant</strong>
        </div>
      </div>
      <button class="toggle" @click="toggle">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            :d="collapsed ? 'M9 18L15 12L9 6' : 'M15 18L9 12L15 6'"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <div class="actions" v-if="!collapsed">
      <button
        class="action primary"
        @click="handleNewConversation"
        :disabled="loadingCreate"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          class="icon-left"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {{ loadingCreate ? "Đang tạo..." : "Cuộc trò chuyện mới" }}
      </button>
      <button class="action disabled" disabled>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          class="icon-left"
        >
          <path
            d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Tìm kiếm trò chuyện (sắp ra mắt)
      </button>
      <button class="action disabled" disabled>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          class="icon-left"
        >
          <path
            d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Yêu thích (sắp ra mắt)
      </button>
    </div>

    <div class="history" v-if="!collapsed">
      <div class="history-title">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          class="icon-left"
        >
          <path
            d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>Lịch sử trò chuyện</span>
      </div>
      <div class="history-list">
        <button
          v-for="conv in conversations"
          :key="conv.id"
          :class="[
            'history-item',
            { active: selectedConversationId === (conv.session_id || conv.id) },
          ]"
          @click="selectConversation(conv)"
        >
          <div class="conversation-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div class="conversation-content">
            <div class="conversation-title">
              {{ conv.title || "Cuộc trò chuyện" }}
              <span v-if="conv.isTyping" class="typing-cursor">|</span>
            </div>
            <div class="conversation-time">
              {{ formatConversationTime(conv.updated_at || conv.created_at) }}
            </div>
          </div>
        </button>
        <div v-if="!loadingList && conversations.length === 0" class="empty">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <p>Chưa có cuộc trò chuyện nào</p>
          <small>Bắt đầu cuộc trò chuyện đầu tiên của bạn</small>
        </div>
        <div v-if="loadingList" class="loading-skeleton-container">
          <LoadingSkeleton
            v-for="n in 3"
            :key="n"
            variant="conversation"
            size="small"
          />
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { chatRepository } from "~/services/chatRepository";
import LoadingSkeleton from "~/components/ui/LoadingSkeleton.vue";

const collapsed = ref(false);
const conversations = ref([]);
const loadingList = ref(false);
const loadingCreate = ref(false);
const loadingSearch = ref(false);
const selectedConversationId = ref("");
const typingIntervals = ref(new Map()); // Để quản lý các interval typing

const toggle = () => {
  collapsed.value = !collapsed.value;
  localStorage.setItem("sidebar_collapsed", collapsed.value ? "1" : "0");
};

const loadPersisted = () => {
  const saved = localStorage.getItem("sidebar_collapsed");
  if (saved === "1") collapsed.value = true;
};

const fetchConversations = async () => {
  loadingList.value = true;
  try {
    conversations.value = await chatRepository.listConversations();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug("Fetch conversations failed", e);
  } finally {
    loadingList.value = false;
  }
};

const handleNewConversation = async () => {
  // Không gọi API. Chỉ reset trạng thái để bắt đầu cuộc trò chuyện mới
  loadingCreate.value = true;
  try {
    selectedConversationId.value = "";
    localStorage.removeItem("current_conversation_id");
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("conversation:selected", { detail: { id: "" } })
      );
    }
    // Không cần fetch lại conversations vì đây là cuộc trò chuyện mới
    // await fetchConversations();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug("New conversation init failed", e);
  } finally {
    loadingCreate.value = false;
  }
};

const handleSearch = async () => {
  loadingSearch.value = true;
  try {
    // If backend requires query, adjust to pass it in
    await chatRepository.searchConversations();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug("Search conversation failed", e);
  } finally {
    loadingSearch.value = false;
  }
};

const formatConversationTime = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return "Vừa xong";
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} giờ trước`;
  } else if (diffInHours < 168) {
    // 7 days
    return `${Math.floor(diffInHours / 24)} ngày trước`;
  } else {
    return date.toLocaleDateString("vi-VN");
  }
};

const selectConversation = (conv) => {
  const id = conv?.session_id || conv?.id;
  if (id) {
    selectedConversationId.value = id;
    localStorage.setItem("current_conversation_id", id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("conversation:selected", { detail: { id } })
      );
    }
  }
};

// Function để clear cache khi cần thiết (ví dụ khi logout hoặc refresh)
const clearConversationCache = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("conversation:clear-cache"));
  }
};

onMounted(() => {
  loadPersisted();
  fetchConversations();

  // Load selected conversation ID from localStorage
  const currentId = localStorage.getItem("current_conversation_id");
  if (currentId) {
    selectedConversationId.value = currentId;
  }

  // Listen for conversation selection events to sync state
  const handleConversationSelected = (e) => {
    const id = e?.detail?.id || "";
    selectedConversationId.value = id;
  };

  // Listen for new conversation created events
  const handleConversationCreated = (e) => {
    const newConversation = e?.detail;
    if (newConversation && newConversation.session_id) {
      // Clear any existing typing interval for this session
      const existingInterval = typingIntervals.value.get(
        newConversation.session_id
      );
      if (existingInterval) {
        clearInterval(existingInterval);
        typingIntervals.value.delete(newConversation.session_id);
      }

      // Thêm conversation mới vào đầu danh sách với title rỗng để tạo hiệu ứng typing
      const conversationItem = {
        session_id: newConversation.session_id,
        title: "",
        created_at: newConversation.created_at,
        updated_at: newConversation.created_at,
        isTyping: true, // Flag để biết đang trong quá trình typing
      };

      conversations.value.unshift(conversationItem);

      // Cập nhật selected conversation
      selectedConversationId.value = newConversation.session_id;

      // Tạo hiệu ứng typing cho title
      const targetTitle = newConversation.title;
      let currentIndex = 0;

      const typingInterval = setInterval(() => {
        if (currentIndex <= targetTitle.length) {
          // Tìm conversation item trong danh sách và cập nhật title
          const itemIndex = conversations.value.findIndex(
            (conv) => conv.session_id === newConversation.session_id
          );
          if (itemIndex !== -1) {
            conversations.value[itemIndex].title = targetTitle.substring(
              0,
              currentIndex
            );
          }
          currentIndex++;
        } else {
          // Hoàn thành typing
          clearInterval(typingInterval);
          typingIntervals.value.delete(newConversation.session_id);

          const itemIndex = conversations.value.findIndex(
            (conv) => conv.session_id === newConversation.session_id
          );
          if (itemIndex !== -1) {
            conversations.value[itemIndex].isTyping = false;
          }
        }
      }, 80); // Tốc độ typing 80ms mỗi ký tự (chậm hơn để dễ nhìn)

      // Lưu interval để có thể clear sau này
      typingIntervals.value.set(newConversation.session_id, typingInterval);
    }
  };

  window.addEventListener("conversation:selected", handleConversationSelected);
  window.addEventListener("conversation:created", handleConversationCreated);

  // Cleanup
  onBeforeUnmount(() => {
    window.removeEventListener(
      "conversation:selected",
      handleConversationSelected
    );
    window.removeEventListener(
      "conversation:created",
      handleConversationCreated
    );

    // Clear all typing intervals
    typingIntervals.value.forEach((interval) => {
      clearInterval(interval);
    });
    typingIntervals.value.clear();
  });
});
</script>

<style scoped>
.conversations {
  width: 320px;
  min-width: 280px;
  max-width: 400px;
  border-right: 1px solid #e2e8f0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  transition: all 0.3s ease;
}

.conversations.collapsed {
  width: 60px;
  min-width: 60px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}

.toggle {
  width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.3s ease;
}

.toggle:hover {
  background: #f1f5f9;
  border-color: #3b82f6;
  color: #3b82f6;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  border-radius: 10px;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  transition: all 0.3s ease;
}

.brand-icon:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-text strong {
  font-weight: 700;
  font-size: 18px;
  color: #1e293b;
  line-height: 1.2;
}

.actions {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
}

.action {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.action:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.action.primary {
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.action.primary:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
}

.action.secondary {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.action.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8fafc;
}

.action .icon-left {
  flex-shrink: 0;
  color: currentColor;
}

.history {
  margin-top: 20px;
  padding: 0 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
}

.history-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  gap: 4px;
}

.history-item {
  padding: 12px 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: #f1f5f9;
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.history-item.active {
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  border-color: #3b82f6;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.history-item.active:hover {
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.conversation-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  border-radius: 8px;
  flex-shrink: 0;
  color: #64748b;
}

.conversation-content {
  flex: 1;
  min-width: 0;
}

.conversation-title {
  font-size: 14px;
  font-weight: 500;
  color: currentColor;
  line-height: 1.3;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-time {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.2;
}

.history-item.active .conversation-time {
  color: rgba(255, 255, 255, 0.8);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
  flex: 1;
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.6;
  color: #94a3b8;
}

.empty p {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #1e293b;
}

.empty small {
  font-size: 12px;
  color: #94a3b8;
}

.loading-skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

/* Scrollbar styling */
.history-list::-webkit-scrollbar {
  width: 4px;
}

.history-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.history-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* removed manual data-theme dark overrides */

/* Responsive design */
@media (max-width: 768px) {
  .conversations {
    width: 280px;
    min-width: 240px;
  }

  .conversations.collapsed {
    width: 50px;
    min-width: 50px;
  }

  .header {
    padding: 16px 12px;
  }

  .actions {
    padding: 0 12px;
  }

  .history {
    padding: 0 12px;
  }

  .brand-text strong {
    font-size: 16px;
  }

  .action {
    padding: 12px 14px;
    font-size: 13px;
  }
}

/* Animation for collapsed state */
.conversations.collapsed .brand,
.conversations.collapsed .actions,
.conversations.collapsed .history {
  opacity: 0;
  pointer-events: none;
}

.conversations:not(.collapsed) .brand,
.conversations:not(.collapsed) .actions,
.conversations:not(.collapsed) .history {
  opacity: 1;
  pointer-events: auto;
  transition: opacity 0.3s ease;
}

/* Typing cursor animation */
.typing-cursor {
  display: inline-block;
  color: #3b82f6;
  font-weight: 400;
  animation: blink 1s infinite;
  margin-left: 1px;
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

/* Conversation item animation when added */
.history-item {
  animation: slideInFromTop 0.3s ease-out;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
