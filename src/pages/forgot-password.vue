<template>
  <div class="forgot-password-background">
    <div class="forgot-password-page">
      <!-- Bước 1: Nhập email -->
      <div v-if="step === 1">
        <h2 class="page-title">Đặt lại mật khẩu</h2>
        <p class="page-subtitle">
          Nhập email để nhận mã xác thực đặt lại mật khẩu
        </p>

        <div class="form-group">
          <div class="input-header">
            <label class="input-label">Email:</label>
          </div>
          <input
            v-model="email"
            type="email"
            placeholder="Nhập địa chỉ email của bạn"
            class="form-input"
          />
          <div v-if="emailError" class="error-message">
            {{ emailError }}
          </div>
          <div v-if="serverError" class="error-message">
            {{ serverError }}
          </div>
        </div>

        <div class="form-actions">
          <button
            @click="handleEmailContinue"
            :disabled="isRequestingOtp"
            class="submit-button"
            :class="{ loading: isRequestingOtp }"
          >
            <LoadingSpinner
              v-if="isRequestingOtp"
              size="small"
              variant="white"
              :text="''"
            />
            {{ isRequestingOtp ? "Đang gửi..." : "Tiếp tục" }}
          </button>
        </div>

        <div class="back-to-login">
          <NuxtLink to="/login" class="back-link">
            ← Quay về Đăng nhập
          </NuxtLink>
        </div>
      </div>

      <!-- Bước 2: Nhập mã xác minh -->
      <div v-else-if="step === 2">
        <h2 class="page-title">Xác thực email</h2>
        <p class="page-subtitle">
          Chúng tôi đã gửi mã xác thực 6 chữ số đến email
          <strong>{{ email }}</strong>
        </p>

        <div class="form-group">
          <div class="input-header">
            <label class="input-label">Mã xác thực:</label>
          </div>
          <div class="otp-container">
            <input
              v-for="(digit, idx) in otp"
              :key="idx"
              ref="otpInput"
              class="otp-input"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="1"
              :value="digit"
              @input="(e) => handleOtpInput(idx, e)"
              @keypress="(e) => handleOtpKeypress(idx, e)"
              @keydown="(e) => handleOtpKeydown(idx, e)"
              @focus="(e) => handleOtpFocus(idx, e)"
              @mousedown="(e) => handleOtpMouseDown(idx, e)"
              @paste="(e) => handleOtpPaste(idx, e)"
            />
          </div>
          <div class="resend-section">
            <button
              @click="handleResend"
              :disabled="countdown > 0"
              class="resend-button"
            >
              Gửi lại mã
              <span v-if="countdown > 0"> ({{ countdown }}s)</span>
            </button>
          </div>
          <div v-if="serverError" class="error-message">
            {{ serverError }}
          </div>
        </div>

        <div class="form-actions">
          <button
            @click="handleVerifyOtp"
            :disabled="loadingVerifyOtp"
            class="submit-button"
            :class="{ loading: loadingVerifyOtp }"
          >
            <LoadingSpinner
              v-if="loadingVerifyOtp"
              size="small"
              variant="white"
              :text="''"
            />
            {{ loadingVerifyOtp ? "Đang xác thực..." : "Xác thực" }}
          </button>
        </div>

        <div class="back-to-login">
          <NuxtLink to="/login" class="back-link">
            ← Quay về Đăng nhập
          </NuxtLink>
        </div>
      </div>

      <!-- Bước 3: Nhập mật khẩu mới -->
      <div v-else-if="step === 3">
        <h2 class="page-title">Mật khẩu mới</h2>
        <p class="page-subtitle">
          Tạo mật khẩu mới để bảo vệ tài khoản của bạn
        </p>

        <div class="form-group">
          <div class="input-header">
            <label class="input-label">Mật khẩu mới:</label>
          </div>
          <div class="password-field">
            <input
              v-model="password_create"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Nhập mật khẩu mới"
              class="form-input password-input"
              @input="validatePassword"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'"
            >
              <v-icon
                size="20"
                color="grey"
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path :d="showPassword ? mdiEyeOff : mdiEye" fill="currentColor" />
                </svg>
              </v-icon>
            </button>
          </div>
          <div v-if="passwordError" class="error-message">
            {{ passwordError }}
          </div>
        </div>

        <div class="form-group">
          <div class="input-header">
            <label class="input-label">Xác nhận mật khẩu:</label>
          </div>
          <div class="password-field">
            <input
              v-model="password_check"
              :type="showPasswordCheck ? 'text' : 'password'"
              placeholder="Nhập lại mật khẩu mới"
              class="form-input password-input"
              @input="validatePasswordRecheck"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPasswordCheck = !showPasswordCheck"
              :aria-label="
                showPasswordCheck ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'
              "
            >
              <v-icon
                size="20"
                color="grey"
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path :d="showPasswordCheck ? mdiEyeOff : mdiEye" fill="currentColor" />
                </svg>
              </v-icon>
            </button>
          </div>
          <div v-if="passwordErrorCheck" class="error-message">
            {{ passwordErrorCheck }}
          </div>
          <div v-if="serverError" class="error-message">
            {{ serverError }}
          </div>
        </div>

        <div class="form-actions">
          <button
            @click="handleResetPassword"
            :disabled="loadingResetPassword"
            class="submit-button"
            :class="{ loading: loadingResetPassword }"
          >
            <LoadingSpinner
              v-if="loadingResetPassword"
              size="small"
              variant="white"
              :text="''"
            />
            {{ loadingResetPassword ? "Đang đặt lại..." : "Đặt lại mật khẩu" }}
          </button>
        </div>

        <div class="back-to-login">
          <NuxtLink to="/login" class="back-link">
            ← Quay về Đăng nhập
          </NuxtLink>
        </div>
      </div>
      <!-- Bước 4: Hoàn tất -->
      <div v-else-if="step === 4" class="success-step">
        <div class="success-icon">
          <img src="/images/tick.png" alt="Success" />
        </div>
        <h2 class="success-title">Thành công!</h2>
        <p class="success-message">
          Mật khẩu của bạn đã được đặt lại thành công. Bây giờ bạn có thể đăng
          nhập với mật khẩu mới.
        </p>

        <div class="form-actions">
          <button @click="comeBackLogin" class="submit-button primary">
            Đăng nhập ngay
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { getApiUrl, API_CONFIG } from "~/config/api";
import { authRepository } from "~/services/authRepository";
import {
  validatePasswordStrength,
  validatePasswordMatch,
} from "~/composables/usePasswordValidation";
import LoadingSpinner from "~/components/ui/LoadingSpinner.vue";
import { mdiEye, mdiEyeOff } from '@mdi/js';

// Thiết lập tiêu đề trang
useHead({
  title: "Quên mật khẩu - Law Consultant",
  meta: [
    {
      name: "description",
      content: "Đặt lại mật khẩu tài khoản Law Consultant của bạn",
    },
    {
      name: "keywords",
      content:
        "quên mật khẩu, forgot password, đặt lại mật khẩu, law consultant",
    },
  ],
});

const router = useRouter();

const step = ref(1);
const email = ref("");
const emailError = ref("");
const serverError = ref("");
const isRequestingOtp = ref(false);
const loadingVerifyOtp = ref(false);
const loadingResetPassword = ref(false);

const code = ref("");
const otp = ref(["", "", "", "", "", ""]);
const otpInput = ref([]);
const newPassword = ref("");
const confirmPassword = ref("");

const password_create = ref("");
const password_check = ref("");

const showPassword = ref(false);
const passwordError = ref("");

const showPasswordCheck = ref(false);
const passwordErrorCheck = ref("");

function goToStep(nextStep) {
  step.value = nextStep;
}

function submitReset() {
  console.log("Mật khẩu đã được đặt lại:", newPassword.value);
}

const countdown = ref(0);
let timer = null;

const handleResend = async () => {
  if (countdown.value > 0) return;

  // Start/restart countdown immediately
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  countdown.value = 60;
  timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);

  try {
    // Call API gửi lại mã
    // const response_otp = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.RESEND_OTP), {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     email: email.value
    //   })
    // })

    // const data_otp = await response_otp.json()
    // if (!response_otp.ok) {
    //   throw new Error(data_otp.message || 'Gửi otp thất bại')
    // }

    await authRepository.resendOtp({
      email: email.value,
    });
  } catch (e) {
    console.error("Resend OTP failed:", e);
    // Stop and reset countdown on error
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    countdown.value = 0;
  }
};

const handleEmailContinue = async () => {
  emailError.value = "";
  serverError.value = "";
  if (!email.value || !email.value.trim()) {
    emailError.value = "Vui lòng nhập email";
    return;
  }
  try {
    isRequestingOtp.value = true;
    await authRepository
      .forgotPassword({
        email: email.value,
      })
      .then((response) => {
        console.log(response);
        goToStep(2);
        nextTick(() => {
          const inputs = otpInput.value;
          if (inputs && inputs[0]) inputs[0].focus();
        });
      })
      .catch((error) => {
        if (error.response.status === 429) {
          serverError.value = "Vui lòng thử lại sau 15 phút";
        } else {
          serverError.value = "Gửi OTP thất bại. Vui lòng thử lại.";
        }
      });
    // nếu API trả về ok thì sang bước 2
    // goToStep(2)
    // nextTick(() => {
    //   const inputs = otpInput.value
    //   if (inputs && inputs[0]) inputs[0].focus()
    // })
  } catch (err) {
    serverError.value =
      (err && err.data && err.data.message) ||
      "Gửi OTP thất bại. Vui lòng thử lại.";
  } finally {
    isRequestingOtp.value = false;
  }
};

const handleOtpInput = (index, event) => {
  const target = event.target;
  const value = target.value.replace(/\D/g, "");
  otp.value[index] = value.slice(-1);
  if (value && index < otp.value.length - 1) {
    const inputs = otpInput.value;
    if (inputs && inputs[index + 1]) inputs[index + 1].focus();
  }
  code.value = otp.value.join("");
};

const handleOtpKeydown = (index, event) => {
  const inputs = otpInput.value;
  if (event.key === "Backspace") {
    if (otp.value[index]) {
      otp.value[index] = "";
      code.value = otp.value.join("");
      return;
    }
    if (index > 0) {
      if (inputs && inputs[index - 1]) inputs[index - 1].focus();
      otp.value[index - 1] = "";
      code.value = otp.value.join("");
    }
  }
  if (event.key === "ArrowLeft" && index > 0) {
    if (inputs && inputs[index - 1]) inputs[index - 1].focus();
  }
  if (event.key === "ArrowRight" && index < otp.value.length - 1) {
    if (inputs && inputs[index + 1]) inputs[index + 1].focus();
  }
};

const handleOtpPaste = (index, event) => {
  event.preventDefault();
  const text = event.clipboardData?.getData("text") || "";
  const digits = text.replace(/\D/g, "").slice(0, 6).split("");
  let start = otp.value.findIndex((d) => d === "");
  if (start === -1) start = 0;
  for (let i = 0; i < digits.length; i++) {
    const pos = start + i;
    if (pos > 5) break;
    otp.value[pos] = digits[i];
  }
  code.value = otp.value.join("");
  const inputs = otpInput.value;
  const nextIndex = Math.min(start + digits.length, 5);
  if (inputs && inputs[nextIndex]) inputs[nextIndex].focus();
};

const firstEmptyIndex = () => otp.value.findIndex((d) => d === "");

const handleOtpFocus = (index, event) => {
  const firstEmpty = firstEmptyIndex();
  if (firstEmpty !== -1 && index > firstEmpty) {
    event.preventDefault();
    const inputs = otpInput.value;
    if (inputs && inputs[firstEmpty]) inputs[firstEmpty].focus();
  }
};

const handleOtpMouseDown = (index, event) => {
  const firstEmpty = firstEmptyIndex();
  if (firstEmpty !== -1 && index > firstEmpty) {
    event.preventDefault();
    const inputs = otpInput.value;
    if (inputs && inputs[firstEmpty]) inputs[firstEmpty].focus();
  }
};

const handleOtpKeypress = (index, event) => {
  const key = event.key;
  if (!/^[0-9]$/.test(key)) {
    event.preventDefault();
  }
};

// Khi step chuyển sang 2 thì tự động bắt đầu đếm
watch(step, (newVal) => {
  if (newVal === 2) {
    handleResend();
  }
});

const handleVerifyOtp = async () => {
  try {
    if (!code.value || code.value.length !== 6) {
      serverError.value = "Vui lòng nhập đủ mã OTP";
      return;
    }

    loadingVerifyOtp.value = true;
    // Gọi API verify OTP
    await authRepository.verifyOtp({
      email: email.value,
      otp_code: code.value,
    });

    // Nếu verify thành công thì chuyển sang bước 3
    goToStep(3);
  } catch (err) {
    serverError.value =
      (err && err.data && err.data.message) || "Mã OTP không hợp lệ";
  } finally {
    loadingVerifyOtp.value = false;
  }
};

const validatePassword = () => {
  const { isValid, message } = validatePasswordStrength(password_create.value);
  passwordError.value = isValid ? "" : message;
};

const validatePasswordRecheck = () => {
  const { isValid, message } = validatePasswordMatch(
    password_create.value,
    password_check.value
  );
  passwordErrorCheck.value = isValid ? "" : message;
};

const handleResetPassword = async () => {
  passwordError.value = "";
  passwordErrorCheck.value = "";
  serverError.value = "";

  // Validate
  if (!password_create.value) {
    passwordError.value = "Vui lòng nhập mật khẩu mới";
    return;
  }
  if (password_create.value !== password_check.value) {
    passwordErrorCheck.value = "Mật khẩu xác nhận không khớp";
    return;
  }

  loadingResetPassword.value = true;
  try {
    await authRepository.resetPassword({
      email: email.value,
      otp_code: code.value,
      new_password: password_create.value,
      confirm_password: password_check.value,
    });

    // Thành công -> sang step 4
    goToStep(4);
  } catch (err) {
    serverError.value =
      (err && err.data && err.data.message) || "Đặt lại mật khẩu thất bại";
  } finally {
    loadingResetPassword.value = false;
  }
};

const comeBackLogin = async () => {
  router.push("/login");
};
</script>

<style scoped>
.forgot-password-background {
  background-image: url("/images/login_background.png");
  background-size: cover;
  background-position: center;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.forgot-password-page {
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
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: #6b7280;
  text-align: center;
  font-size: 14px;
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

.submit-button.primary {
  background-color: #10b981;
}

.submit-button.primary:hover:not(:disabled) {
  background-color: #059669;
}

/* Back to Login */
.back-to-login {
  text-align: center;
  margin-top: 1.5rem;
}

.back-link {
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

/* Error Messages */
.error-message {
  color: #dc2626;
  font-size: 12px;
  margin-top: 6px;
  font-family: Arial, sans-serif;
}

/* OTP Container */
.otp-container {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 1rem 0;
}

.otp-input {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  text-align: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.otp-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.resend-section {
  text-align: center;
  margin-top: 1rem;
}

.resend-button {
  background: none;
  border: none;
  color: #007bff;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.resend-button:hover:not(:disabled) {
  background-color: #f0f9ff;
  color: #0056b3;
}

.resend-button:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

/* Success Step */
.success-step {
  text-align: center;
}

.success-icon {
  margin-bottom: 1.5rem;
}

.success-icon img {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.success-title {
  color: #059669;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 1rem 0;
}

.success-message {
  color: #6b7280;
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .forgot-password-background {
    padding: 20px;
  }

  .forgot-password-page {
    max-width: 100%;
    min-width: auto;
    padding: 1.5rem;
    margin: 0;
  }

  .page-title {
    font-size: 22px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .otp-input {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    font-size: 16px;
  }

  .otp-container {
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .forgot-password-background {
    padding: 16px;
  }

  .forgot-password-page {
    padding: 1.25rem;
  }

  .page-title {
    font-size: 20px;
  }

  .otp-input {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    font-size: 15px;
  }

  .otp-container {
    gap: 8px;
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
  .forgot-password-background {
    padding: 12px;
  }

  .forgot-password-page {
    padding: 1rem;
  }

  .otp-input {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    font-size: 14px;
  }

  .otp-container {
    gap: 6px;
  }
}
</style>
