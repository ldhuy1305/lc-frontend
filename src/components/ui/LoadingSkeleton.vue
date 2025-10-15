<template>
  <div class="skeleton-container" :class="[variantClass, sizeClass]">
    <!-- Chat message skeleton -->
    <div v-if="variant === 'chat'" class="skeleton-chat">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-content">
        <div class="skeleton-line" style="width: 80%"></div>
        <div class="skeleton-line" style="width: 60%"></div>
        <div class="skeleton-line" style="width: 90%"></div>
      </div>
    </div>

    <!-- Conversation item skeleton -->
    <div v-else-if="variant === 'conversation'" class="skeleton-conversation">
      <div class="skeleton-line" style="width: 70%"></div>
      <div class="skeleton-line" style="width: 40%"></div>
    </div>

    <!-- Button skeleton -->
    <div v-else-if="variant === 'button'" class="skeleton-button">
      <div class="skeleton-line"></div>
    </div>

    <!-- Generic skeleton -->
    <div v-else class="skeleton-generic">
      <div class="skeleton-line" style="width: 100%"></div>
      <div class="skeleton-line" style="width: 85%"></div>
      <div class="skeleton-line" style="width: 70%"></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: "generic",
    validator: (value) =>
      ["generic", "chat", "conversation", "button"].includes(value),
  },
  size: {
    type: String,
    default: "medium",
    validator: (value) => ["small", "medium", "large"].includes(value),
  },
});

const variantClass = computed(() => `skeleton-${props.variant}`);
const sizeClass = computed(() => `skeleton-${props.size}`);
</script>

<style scoped>
.skeleton-container {
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-chat {
  display: flex;
  gap: 12px;
  padding: 12px;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
}

.skeleton-conversation {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.skeleton-button {
  padding: 12px 24px;
  border-radius: 6px;
}

.skeleton-generic {
  padding: 16px;
}

/* Size variations */
.skeleton-small .skeleton-line {
  height: 10px;
  margin-bottom: 6px;
}

.skeleton-small .skeleton-avatar {
  width: 32px;
  height: 32px;
}

.skeleton-large .skeleton-line {
  height: 16px;
  margin-bottom: 12px;
}

.skeleton-large .skeleton-avatar {
  width: 48px;
  height: 48px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
