<template>
  <div class="loading-demo">
    <h3>Loading Components Demo</h3>

    <!-- Loading Spinner Demo -->
    <div class="demo-section">
      <h4>Loading Spinner</h4>
      <div class="demo-row">
        <LoadingSpinner size="small" text="Small spinner" />
        <LoadingSpinner size="medium" text="Medium spinner" />
        <LoadingSpinner size="large" text="Large spinner" />
      </div>
      <div class="demo-row">
        <LoadingSpinner size="medium" variant="secondary" text="Secondary" />
        <LoadingSpinner size="medium" variant="white" text="White" />
      </div>
    </div>

    <!-- Loading Skeleton Demo -->
    <div class="demo-section">
      <h4>Loading Skeleton</h4>
      <div class="demo-row">
        <LoadingSkeleton variant="generic" size="small" />
        <LoadingSkeleton variant="generic" size="medium" />
        <LoadingSkeleton variant="generic" size="large" />
      </div>
      <div class="demo-row">
        <LoadingSkeleton variant="chat" size="medium" />
        <LoadingSkeleton variant="conversation" size="small" />
        <LoadingSkeleton variant="button" size="small" />
      </div>
    </div>

    <!-- Loading Overlay Demo -->
    <div class="demo-section">
      <h4>Loading Overlay</h4>
      <div class="demo-container">
        <button @click="showOverlay = !showOverlay" class="demo-button">
          Toggle Overlay
        </button>
        <div class="demo-content">
          <p>Nội dung demo cho overlay loading</p>
          <p>Khi bật overlay, nội dung này sẽ bị che phủ</p>
        </div>
        <LoadingOverlay :visible="showOverlay" text="Đang xử lý..." />
      </div>
    </div>

    <!-- Async Loading Demo -->
    <div class="demo-section">
      <h4>Async Loading với Composable</h4>
      <div class="demo-row">
        <button @click="fetchData" :disabled="isLoading" class="demo-button">
          {{ isLoading ? "Đang tải..." : "Tải dữ liệu" }}
        </button>
        <button
          @click="fetchMultipleData"
          :disabled="isAnyLoading"
          class="demo-button"
        >
          {{ isAnyLoading ? "Đang tải..." : "Tải nhiều dữ liệu" }}
        </button>
      </div>
      <div v-if="data" class="demo-result">
        <p>Dữ liệu đã tải: {{ data }}</p>
      </div>
      <div v-if="loadingKeys.length > 0" class="demo-result">
        <p>Đang tải: {{ loadingKeys.join(", ") }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import LoadingSpinner from "./LoadingSpinner.vue";
import LoadingSkeleton from "./LoadingSkeleton.vue";
import LoadingOverlay from "./LoadingOverlay.vue";
import {
  useLoading,
  useMultipleLoading,
  useAsyncLoading,
} from "~/composables/useLoading";

const showOverlay = ref(false);
const data = ref(null);

// Demo single loading
const { isLoading, startLoading, stopLoading } = useLoading();

// Demo multiple loading
const {
  startLoading: startMultipleLoading,
  stopLoading: stopMultipleLoading,
  isAnyLoading,
  loadingKeys,
} = useMultipleLoading(["api1", "api2", "api3"]);

// Demo async loading
const fetchData = useAsyncLoading(async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 2000));
  data.value = "Dữ liệu từ API";
  return data.value;
});

const fetchMultipleData = async () => {
  // Simulate multiple API calls
  startMultipleLoading("api1");
  startMultipleLoading("api2");

  try {
    await Promise.all([
      new Promise((resolve) => setTimeout(resolve, 1500)),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } finally {
    stopMultipleLoading("api1");
    stopMultipleLoading("api2");
  }
};
</script>

<style scoped>
.loading-demo {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.demo-section {
  margin-bottom: 32px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.demo-section h4 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #374151;
}

.demo-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.demo-container {
  position: relative;
  min-height: 200px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
}

.demo-content {
  padding: 16px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.demo-button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.demo-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.demo-result {
  margin-top: 16px;
  padding: 12px;
  background: #e7f3ff;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.demo-result p {
  margin: 0;
  font-size: 14px;
  color: #0056b3;
}
</style>
