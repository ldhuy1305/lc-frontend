# API Services với Refresh Token

## 🔐 **Refresh Token Implementation**

### **Tính năng chính:**

1. **Automatic Token Refresh** - Tự động refresh token khi hết hạn
2. **Retry Logic** - Retry request với token mới khi gặp 401
3. **Centralized Token Management** - Quản lý token tập trung
4. **Streaming Support** - Hỗ trợ refresh token cho streaming API

### **Cách sử dụng:**

#### 1. **useTokenManager Composable**

```typescript
import { useTokenManager } from "~/composables/useTokenManager";

const { getValidToken, isAuthenticated, forceRefresh } = useTokenManager();

// Lấy token hợp lệ (tự động refresh nếu cần)
const token = await getValidToken();

// Kiểm tra trạng thái đăng nhập
if (isAuthenticated.value) {
  // User đã đăng nhập
}

// Force refresh token
const newToken = await forceRefresh();
```

#### 2. **ChatRepository với Refresh Token**

```typescript
// Tự động xử lý refresh token cho streaming
await chatRepository.createChatStream(
  { message: "Hello" },
  (chunk) => console.log(chunk),
  (sessionInfo) => console.log(sessionInfo),
  () => console.log("Complete"),
  (error) => console.error(error)
);
```

#### 3. **AuthRepository với Enhanced Methods**

```typescript
// Kiểm tra token hết hạn
const isExpired = authRepository.isTokenExpired();

// Lấy token hợp lệ
const validToken = await authRepository.getValidToken();

// Refresh token với retry
const result = await authRepository.refreshTokenWithRetry();
```

### **Flow hoạt động:**

1. **Request được gửi** với access token hiện tại
2. **Nếu 401** → Tự động gọi refresh token
3. **Retry request** với token mới
4. **Nếu refresh thất bại** → Clear tokens và redirect login

### **Error Handling:**

- ✅ **Token expired** → Auto refresh
- ✅ **Refresh failed** → Clear tokens & redirect
- ✅ **Network error** → Retry với exponential backoff
- ✅ **Invalid tokens** → Clear và redirect

### **Streaming API Support:**

- ✅ **Pre-request token validation**
- ✅ **401 handling với retry**
- ✅ **Seamless streaming experience**
- ✅ **Automatic token refresh**

### **Security Features:**

- 🔒 **JWT expiration check**
- 🔒 **Secure token storage**
- 🔒 **Automatic cleanup on failure**
- 🔒 **Prevent token leakage**

## 🚀 **Best Practices:**

1. **Luôn sử dụng `getValidToken()`** thay vì lấy token trực tiếp
2. **Handle refresh errors** một cách graceful
3. **Clear tokens** khi refresh thất bại
4. **Use composable** cho token management
5. **Monitor refresh status** với `isRefreshing`

## 📝 **Example Usage:**

```typescript
// Trong component
const { getValidToken, isAuthenticated } = useTokenManager();

// Trước khi gọi API
const token = await getValidToken();
if (!token) {
  // Redirect to login
  return;
}

// Gọi API với token hợp lệ
const response = await api.get("/data", {
  headers: { Authorization: `Bearer ${token}` },
});
```

## 🔧 **Configuration:**

Refresh token được cấu hình trong:

- `src/config/api.ts` - API endpoints
- `src/services/authRepository.ts` - Auth logic
- `src/composables/useTokenManager.ts` - Token management
- `src/services/chatRepository.ts` - Chat API với refresh support
