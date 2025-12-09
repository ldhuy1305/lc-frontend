<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="search-modal-backdrop" @click="close">
        <div class="search-modal-container" @click.stop>
          <div class="search-input-wrapper">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              class="search-icon"
            >
              <path
                d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              class="search-input"
              @keydown.down.prevent="navigate('down')"
              @keydown.up.prevent="navigate('up')"
              @keydown.enter.prevent="selectResult"
              @keydown.esc="close"
            />
            <button v-if="query" class="clear-button" @click="query = ''">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <button 
              class="esc-button" 
              @click="close"
              type="button"
              title="Close" 
              aria-label="Close search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <div class="search-results-container">
            <!-- Loading Indicator -->
             <div v-if="loading" class="loading-state">
              <svg class="spinner" viewBox="0 0 50 50">
                <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
              </svg>
              <span>Đang tìm kiếm...</span>
             </div>

            <div class="search-results" v-else-if="displayConversations.length > 0">
              <div
                v-for="(conv, index) in displayConversations"
                :key="conv.id || conv.session_id"
                :class="['result-item', { active: activeIndex === index }]"
                @click="selectConversation(conv)"
                @mouseenter="activeIndex = index"
              >
                <div class="result-icon">
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
                <div class="result-content">
                  <div class="result-title">
                    {{ conv.title || conv.session_title || "Cuộc trò chuyện" }}
                  </div>
                  <div class="result-snippet" v-if="conv.snippet">
                    {{ conv.snippet }}
                  </div>
                  <div class="result-time">
                    {{ formatTime(conv.updated_at || conv.created_at) }}
                  </div>
                </div>

              </div>
            </div>

            <div
              class="empty-state"
              v-else-if="query && !loading && displayConversations.length === 0"
            >
              <p>Không tìm thấy kết quả nào cho "{{ query }}"</p>
            </div>
            
            <div class="empty-state" v-else>
               <p class="hint">Nhập để tìm kiếm...</p>
            </div>
          </div>
          

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { chatRepository } from "~/services/chatRepository";

const props = defineProps({
  isOpen: Boolean,
  conversations: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "select"]);

const query = ref("");
const activeIndex = ref(0);
const inputRef = ref(null);
const searchResults = ref([]);
const loading = ref(false);
const debounceTimeout = ref(null);

const displayConversations = computed(() => {
  if (!query.value) return props.conversations.slice(0, 5); // Recent
  return searchResults.value;
});

const handleSearch = async () => {
  if (!query.value.trim()) {
    searchResults.value = [];
    return;
  }

  loading.value = true;
  try {
    const results = await chatRepository.searchConversations(query.value);
    searchResults.value = results;
  } catch (error) {
    console.error("Search failed", error);
    searchResults.value = [];
  } finally {
    loading.value = false;
  }
};

const debouncedSearch = () => {
  if (debounceTimeout.value) clearTimeout(debounceTimeout.value);
  
  if (!query.value) {
      searchResults.value = [];
      return;
  }

  loading.value = true; // Show loading immediately to indicate responsiveness
  debounceTimeout.value = setTimeout(() => {
    handleSearch();
  }, 300);
};

watch(query, () => {
  debouncedSearch();
});

watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal) {
      query.value = "";
      activeIndex.value = 0;
      searchResults.value = [];
      await nextTick();
      inputRef.value?.focus();
    }
  }
);

watch(displayConversations, () => {
  activeIndex.value = 0;
});

const close = () => {
  emit("close");
};

const navigate = (direction) => {
  if (displayConversations.value.length === 0) return;
  if (direction === "down") {
    activeIndex.value =
      (activeIndex.value + 1) % displayConversations.value.length;
  } else {
    activeIndex.value =
      (activeIndex.value - 1 + displayConversations.value.length) %
      displayConversations.value.length;
  }
};

const selectResult = () => {
  if (displayConversations.value.length > 0) {
    selectConversation(displayConversations.value[activeIndex.value]);
  }
};

const selectConversation = (conv) => {
  emit("select", conv);
  close();
};

const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN");
};
</script>

<style scoped>
.search-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
}

.search-modal-container {
  width: 100%;
  max-width: 600px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: 0 16px;
  border: 1px solid #e2e8f0;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  gap: 12px;
}

.search-icon {
  color: #94a3b8;
}

.search-input {
  flex: 1;
  font-size: 16px;
  color: #1e293b;
  outline: none;
  background: transparent;
  border: none;
}

.search-input::placeholder {
  color: #94a3b8;
}

.clear-button {
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.clear-button:hover {
  background: #f1f5f9;
  color: #64748b;
}

.esc-button {
  margin-left: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  color: #94a3b8;
}

.esc-button:hover {
  background: #f1f5f9;
  color: #64748b;
}





.search-results {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-item.active {
  background: #f1f5f9;
}

.result-icon {
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-snippet {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.result-time {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}



.empty-state {
  padding: 32px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

.hint {
    color: #94a3b8;
}





/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.search-modal-container {
    animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: #64748b;
  gap: 12px;
  font-size: 14px;
}

.spinner {
  animation: rotate 2s linear infinite;
  width: 20px;
  height: 20px;
}

.path {
  stroke: #3b82f6;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>
