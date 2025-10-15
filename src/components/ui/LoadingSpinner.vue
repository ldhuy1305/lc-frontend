<template>
  <div class="loading-spinner" :class="[sizeClass, variantClass]">
    <div class="spinner"></div>
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
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
    default: "",
  },
  centered: {
    type: Boolean,
    default: false,
  },
});

const sizeClass = computed(() => `spinner-${props.size}`);
const variantClass = computed(() => `spinner-${props.variant}`);
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.loading-spinner.centered {
  justify-content: center;
  min-height: 200px;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-primary {
  border-top-color: #007bff;
}

.spinner-secondary {
  border-top-color: #6c757d;
}

.spinner-white {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
}

.spinner-small .spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.spinner-medium .spinner {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

.spinner-large .spinner {
  width: 60px;
  height: 60px;
  border-width: 4px;
}

.loading-text {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
}

.spinner-white .loading-text {
  color: rgba(255, 255, 255, 0.8);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
