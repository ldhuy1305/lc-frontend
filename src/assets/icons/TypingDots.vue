<template>
  <div :class="['typing-indicator', className]">
    <span
      v-for="n in 3"
      :key="n"
      class="dot"
      :style="{ animationDelay: `${(n - 1) * -0.16}s` }"
    ></span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  className?: string;
}

withDefaults(defineProps<Props>(), {
  className: "",
});
</script>

<style scoped>
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: dotPulse 1.4s infinite ease-in-out both;
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
</style>
