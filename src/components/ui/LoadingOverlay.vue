<template>
  <div
    v-if="visible"
    class="loading-overlay"
    :class="{ 'full-screen': fullScreen }"
  >
    <div class="loading-content">
      <LoadingSpinner :size="size" :variant="variant" :text="text" />
    </div>
  </div>
</template>

<script setup>
import LoadingSpinner from "./LoadingSpinner.vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  fullScreen: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: "medium",
    validator: (value) => ["small", "medium", "large"].includes(value),
  },
  variant: {
    type: String,
    default: "primary",
    validator: (value) => ["primary", "secondary", "white"].includes(value),
  },
  text: {
    type: String,
    default: "Đang tải...",
  },
});
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.loading-overlay.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading-overlay.full-screen .loading-content {
  background: transparent;
  box-shadow: none;
}
</style>
