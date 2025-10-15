import { ref, computed } from "vue";

/**
 * Composable để quản lý loading state
 * @param initialLoading - Trạng thái loading ban đầu
 */
export function useLoading(initialLoading = false) {
  const isLoading = ref(initialLoading);

  const startLoading = () => {
    isLoading.value = true;
  };

  const stopLoading = () => {
    isLoading.value = false;
  };

  const toggleLoading = () => {
    isLoading.value = !isLoading.value;
  };

  const setLoading = (loading: boolean) => {
    isLoading.value = loading;
  };

  // Computed để kiểm tra trạng thái
  const isIdle = computed(() => !isLoading.value);
  const isPending = computed(() => isLoading.value);

  return {
    isLoading: readonly(isLoading),
    isIdle,
    isPending,
    startLoading,
    stopLoading,
    toggleLoading,
    setLoading,
  };
}

/**
 * Composable để quản lý nhiều loading state cùng lúc
 * @param loadingKeys - Mảng các key để quản lý loading
 */
export function useMultipleLoading(loadingKeys: string[] = []) {
  const loadingStates = ref<Record<string, boolean>>({});

  // Khởi tạo tất cả loading states là false
  loadingKeys.forEach((key) => {
    loadingStates.value[key] = false;
  });

  const startLoading = (key: string) => {
    loadingStates.value[key] = true;
  };

  const stopLoading = (key: string) => {
    loadingStates.value[key] = false;
  };

  const setLoading = (key: string, loading: boolean) => {
    loadingStates.value[key] = loading;
  };

  const isLoading = (key: string) => {
    return loadingStates.value[key] || false;
  };

  // Computed để kiểm tra có bất kỳ loading nào đang chạy
  const isAnyLoading = computed(() => {
    return Object.values(loadingStates.value).some((loading) => loading);
  });

  // Computed để lấy danh sách các key đang loading
  const loadingKeys = computed(() => {
    return Object.entries(loadingStates.value)
      .filter(([_, loading]) => loading)
      .map(([key, _]) => key);
  });

  return {
    loadingStates: readonly(loadingStates),
    isAnyLoading,
    loadingKeys,
    startLoading,
    stopLoading,
    setLoading,
    isLoading,
  };
}

/**
 * Composable để wrap async function với loading state
 * @param asyncFn - Function async cần wrap
 * @param options - Các tùy chọn
 */
export function useAsyncLoading<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  options: {
    initialLoading?: boolean;
    onError?: (error: any) => void;
    onSuccess?: (result: any) => void;
  } = {}
) {
  const { isLoading, startLoading, stopLoading } = useLoading(
    options.initialLoading
  );

  const execute = async (...args: Parameters<T>) => {
    startLoading();
    try {
      const result = await asyncFn(...args);
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      options.onError?.(error);
      throw error;
    } finally {
      stopLoading();
    }
  };

  return {
    isLoading: readonly(isLoading),
    execute,
  };
}
