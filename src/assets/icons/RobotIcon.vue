<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :class="className"
  >
    <!-- Robot Head -->
    <rect
      x="6"
      y="4"
      width="12"
      height="10"
      rx="2"
      fill="currentColor"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <!-- Robot Antenna -->
    <line
      x1="12"
      y1="4"
      x2="12"
      y2="2"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <circle cx="12" cy="2" r="1" fill="currentColor" />
    <!-- Robot Eyes -->
    <circle cx="9" cy="8" r="1.5" fill="#ffffff" />
    <circle cx="15" cy="8" r="1.5" fill="#ffffff" />
    <!-- Robot Eyes Pupils -->
    <circle cx="9" cy="8" r="0.8" fill="currentColor" />
    <circle cx="15" cy="8" r="0.8" fill="currentColor" />
    <!-- Robot Mouth -->
    <rect x="10" y="11" width="4" height="1.5" rx="0.5" fill="#ffffff" />
    <!-- Robot Body -->
    <rect
      x="7"
      y="14"
      width="10"
      height="8"
      rx="1"
      fill="currentColor"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <!-- Robot Control Panel -->
    <rect x="9" y="16" width="2" height="1" rx="0.3" fill="#ffffff" />
    <rect x="12" y="16" width="2" height="1" rx="0.3" fill="#ffffff" />
    <rect x="9" y="18" width="2" height="1" rx="0.3" fill="#ffffff" />
    <rect x="12" y="18" width="2" height="1" rx="0.3" fill="#ffffff" />
    <!-- Robot Arms -->
    <rect x="4" y="16" width="3" height="2" rx="0.5" fill="currentColor" />
    <rect x="17" y="16" width="3" height="2" rx="0.5" fill="currentColor" />
    <!-- Robot Hands -->
    <circle cx="5.5" cy="18.5" r="0.8" fill="currentColor" />
    <circle cx="18.5" cy="18.5" r="0.8" fill="currentColor" />
  </svg>
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
