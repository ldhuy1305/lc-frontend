<template>
  <div class="login-background" style="background-image: url('/images/login_background.webp')">
    <div class="login-page">
      <h2 class="page-title">Law Consultant</h2>
      <p class="page-subtitle">Chào mừng bạn quay trở lại!</p>

      <div class="form-group">
        <div class="input-header">
          <label class="input-label">Email:</label>
        </div>
        <input
          v-model="username"
          type="email"
          placeholder="Nhập địa chỉ email của bạn"
          class="form-input"
          @keydown.enter="handleLogin"
        />
      </div>

      <!-- <div>
        <label style="color: black; font-family: Arial, sans-serif; font-size: 12px;">Mật khẩu:</label>
        <input v-model="password" type="password" placeholder="Nhập vào mật khẩu"/>
      </div> -->

      <div class="form-group">
        <div class="password-header">
          <label class="input-label">Mật khẩu:</label>
          <NuxtLink to="/forgot-password" class="forgot-link">
            Quên mật khẩu?
          </NuxtLink>
        </div>
        <div class="password-field">
          <input
            v-model="password"
            id="user-password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Nhập mật khẩu của bạn"
            class="form-input password-input"
            @keydown.enter="handleLogin"
          />
          <button
            type="button"
            class="toggle-password"
            @click="showPassword = !showPassword"
            :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'"
          >
            <v-icon
              :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              size="20"
              color="grey"
            ></v-icon>
          </button>
        </div>
      </div>

      <div class="form-actions">
        <button
          @click="handleLogin"
          :disabled="loading"
          class="submit-button"
          :class="{ loading: loading }"
        >
          <LoadingSpinner
            v-if="loading"
            size="small"
            variant="white"
            :text="''"
          />
          {{ loading ? "Đang đăng nhập..." : "Đăng nhập" }}
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="register-link-section">
        <span class="register-text">Bạn chưa có tài khoản?</span>
        <NuxtLink to="/register" class="register-link">Đăng ký ngay</NuxtLink>
      </div>

      <!-- <div style="text-align: center; margin-top: 1.5rem; margin-bottom: 1.5rem;">
        <button
          style="background-color: white; color: black; border: 1px solid #ccc; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-family: Arial, sans-serif; width:60%"
        >
          Tiếp tục với Google
        </button>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import Header from "~/components/layout/Header";
import Footer from "~/components/layout/Footer";
import LoadingSpinner from "~/components/ui/LoadingSpinner.vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getApiUrl, API_CONFIG } from "~/config/api";
import { authRepository } from "~/services/authRepository";

// Thiết lập tiêu đề trang
useHead({
  title: "Đăng nhập - Law Consultant",
  meta: [
    {
      name: "description",
      content:
        "Đăng nhập vào hệ thống Law Consultant để sử dụng dịch vụ tư vấn pháp lý AI",
    },
    {
      name: "keywords",
      content: "đăng nhập, login, law consultant, tư vấn pháp lý",
    },
  ],
});

// State
const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const showPassword = ref(false);

const router = useRouter();

// Function to call API
const handleLogin = async () => {
  error.value = "";

  if (!username.value || !password.value) {
    error.value = "Vui lòng nhập đầy đủ email và password";
    return;
  }

  loading.value = true;

  try {
    const data = await authRepository.login({
      email: username.value,
      password: password.value,
    });

    // Backend trả về access_token và refresh_token
    const { access_token, refresh_token } = data.data;

    if (access_token && refresh_token) {
      // Lưu vào localStorage hoặc store tùy ứng dụng của bạn
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);

      // Điều hướng sang trang chính
      router.push("/");
    } else {
      error.value = "Đăng nhập thất bại: Thiếu token";
    }
  } catch (err) {
    // BE will return raw error; simply display it
    const raw = err?.response?.data;
    error.value =
      typeof raw === "string"
        ? raw
        : raw?.detail ||
          raw?.message ||
          raw?.error ||
          err?.message ||
          "Đăng nhập thất bại";
    if (process?.env?.NODE_ENV !== "production") {
      // Hỗ trợ debug khi phát triển
      // eslint-disable-next-line no-console
      console.debug("Login error response:", err?.response?.data || err);
    }
  } finally {
    loading.value = false;
  }
};

// const testLogin = async () => {
//   error.value = ''

//   if (!username.value || !password.value) {
//     error.value = 'Vui lòng nhập đầy đủ username và password'
//     return
//   }
//   else {
//       // Lưu vào localStorage hoặc store tùy ứng dụng của bạn
//       localStorage.setItem('username', username.value)
//       localStorage.setItem('pass', password.value)

//       // Điều hướng sang trang chính
//       router.push('/ChatApp')
//   }

// }
</script>

<style scoped>
.login-background {
  /* background-image: url("/images/login_background.png"); Moved to inline style for webp support */
  background-size: cover;
  background-position: center;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-page {
  width: 100%;
  max-width: 420px;
  min-width: 320px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Typography */
.page-title {
  color: #1f2937;
  text-align: center;
  font-family: Arial, sans-serif;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: #6b7280;
  text-align: center;
  font-size: 16px;
  margin: 0 0 2rem 0;
  line-height: 1.5;
}

/* Form Layout */
.form-group {
  margin-bottom: 1.5rem;
}

.input-header {
  margin-bottom: 6px;
}

.input-label {
  color: #374151;
  font-family: Arial, sans-serif;
  font-size: 14px;
  font-weight: 600;
  display: block;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  transition: all 0.2s ease;
  background-color: #ffffff;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

/* Password Field */
.password-field {
  position: relative;
}

.password-input {
  padding-right: 48px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.toggle-password:hover {
  background-color: #f3f4f6;
}

/* Password Header with Forgot Link */
.password-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.forgot-link {
  color: #007bff;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.forgot-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

/* Submit Button */
.form-actions {
  margin: 2rem 0;
}

.submit-button {
  width: 100%;
  background-color: #007bff;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  min-height: 48px;
}

.submit-button:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.submit-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.submit-button.loading {
  background-color: #6c757d;
}

/* Error Messages */
.error-message {
  color: #dc2626;
  font-size: 12px;
  margin-top: 6px;
  font-family: Arial, sans-serif;
  text-align: center;
}

/* Register Link Section */
.register-link-section {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.register-text {
  color: #6b7280;
  font-size: 14px;
  margin-right: 8px;
}

.register-link {
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.2s ease;
}

.register-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-background {
    padding: 20px;
  }

  .login-page {
    max-width: 100%;
    min-width: auto;
    padding: 1.5rem;
    margin: 0;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .login-background {
    padding: 16px;
  }

  .login-page {
    padding: 1.25rem;
  }

  .page-title {
    font-size: 22px;
  }

  .form-input {
    padding: 10px 14px;
    font-size: 14px;
  }

  .submit-button {
    padding: 10px 16px;
    font-size: 15px;
  }
}

@media (max-width: 360px) {
  .login-background {
    padding: 12px;
  }

  .login-page {
    padding: 1rem;
  }
}

/* Responsive design */
@media (max-width: 1024px) {
  .login-page {
    max-width: 450px;
    min-width: 350px;
    padding: 1rem;
  }

  .login-background {
    padding: 30px;
  }
}

@media (max-width: 768px) {
  .login-page {
    max-width: 90%;
    min-width: 320px;
    padding: 0.8rem;
  }

  .login-background {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .login-page {
    max-width: 95%;
    min-width: 250px;
    padding: 0.6rem;
  }

  .login-background {
    padding: 15px;
  }

  .password-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .forgot-link {
    align-self: flex-end;
  }
}
</style>
