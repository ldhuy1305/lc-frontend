# Loading Components

Bộ sưu tập các component loading để cải thiện trải nghiệm người dùng trong ứng dụng Nuxt.js.

## Components

### 1. LoadingSpinner

Component spinner loading đơn giản với nhiều kích thước và màu sắc.

```vue
<template>
  <!-- Basic usage -->
  <LoadingSpinner />

  <!-- With size and variant -->
  <LoadingSpinner size="large" variant="secondary" text="Đang tải..." />

  <!-- Centered -->
  <LoadingSpinner centered />
</template>
```

**Props:**

- `size`: `'small' | 'medium' | 'large'` (default: `'medium'`)
- `variant`: `'primary' | 'secondary' | 'white'` (default: `'primary'`)
- `text`: `string` - Text hiển thị bên dưới spinner
- `centered`: `boolean` - Căn giữa spinner (default: `false`)

### 2. LoadingSkeleton

Component skeleton loading để hiển thị cấu trúc layout trong khi tải.

```vue
<template>
  <!-- Generic skeleton -->
  <LoadingSkeleton />

  <!-- Chat message skeleton -->
  <LoadingSkeleton variant="chat" size="medium" />

  <!-- Multiple skeletons -->
  <div v-for="n in 3" :key="n">
    <LoadingSkeleton variant="conversation" size="small" />
  </div>
</template>
```

**Props:**

- `variant`: `'generic' | 'chat' | 'conversation' | 'button'` (default: `'generic'`)
- `size`: `'small' | 'medium' | 'large'` (default: `'medium'`)

### 3. LoadingOverlay

Component overlay loading để che phủ toàn bộ container.

```vue
<template>
  <div class="content-container">
    <div class="content">
      <!-- Your content here -->
    </div>
    <LoadingOverlay :visible="isLoading" text="Đang xử lý..." size="large" />
  </div>
</template>
```

**Props:**

- `visible`: `boolean` - Hiển thị/ẩn overlay
- `fullScreen`: `boolean` - Overlay toàn màn hình (default: `false`)
- `size`: `'small' | 'medium' | 'large'` (default: `'medium'`)
- `variant`: `'primary' | 'secondary' | 'white'` (default: `'primary'`)
- `text`: `string` - Text hiển thị (default: `'Đang tải...'`)

## Composables

### 1. useLoading

Composable cơ bản để quản lý loading state.

```vue
<script setup>
import { useLoading } from "~/composables/useLoading";

const { isLoading, startLoading, stopLoading } = useLoading();

const handleSubmit = async () => {
  startLoading();
  try {
    await apiCall();
  } finally {
    stopLoading();
  }
};
</script>

<template>
  <button :disabled="isLoading">
    {{ isLoading ? "Đang tải..." : "Submit" }}
  </button>
</template>
```

### 2. useMultipleLoading

Composable để quản lý nhiều loading state cùng lúc.

```vue
<script setup>
import { useMultipleLoading } from "~/composables/useLoading";

const { startLoading, stopLoading, isAnyLoading, isLoading } =
  useMultipleLoading(["fetch", "save", "delete"]);

const handleFetch = async () => {
  startLoading("fetch");
  try {
    await fetchData();
  } finally {
    stopLoading("fetch");
  }
};
</script>
```

### 3. useAsyncLoading

Composable để wrap async function với loading state.

```vue
<script setup>
import { useAsyncLoading } from "~/composables/useLoading";

const fetchData = useAsyncLoading(
  async () => {
    const response = await api.getData();
    return response.data;
  },
  {
    onSuccess: (data) => console.log("Success:", data),
    onError: (error) => console.error("Error:", error),
  }
);

const handleClick = () => {
  fetchData.execute();
};
</script>

<template>
  <button @click="handleClick" :disabled="fetchData.isLoading.value">
    {{ fetchData.isLoading.value ? "Đang tải..." : "Tải dữ liệu" }}
  </button>
</template>
```

## CSS Classes

### Utility Classes

```css
/* Loading container */
.loading-container {
  position: relative;
}

/* Loading overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

/* Full screen loading */
.loading-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

/* Animations */
.pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

.shimmer {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

## Best Practices

1. **Sử dụng skeleton loading** cho danh sách dữ liệu phức tạp
2. **Sử dụng spinner** cho các action đơn giản
3. **Sử dụng overlay** khi cần che phủ toàn bộ container
4. **Luôn có fallback** khi API call thất bại
5. **Sử dụng finally block** để đảm bảo loading state được reset

## Examples

Xem file `LoadingDemo.vue` để có ví dụ đầy đủ về cách sử dụng tất cả các component và composable.
