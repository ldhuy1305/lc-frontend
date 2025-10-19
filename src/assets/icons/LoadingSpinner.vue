<template>
  <div
    :class="['loading-spinner', className]"
    :style="{ width: size + 'px', height: size + 'px' }"
  ></div>
</template>

<script setup lang="ts">
interface Props {
  size?: number | string;
  className?: string;
}

withDefaults(defineProps<Props>(), {
  size: 20,
  className: "",
});
</script>

<style scoped>
.loading-spinner {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
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
