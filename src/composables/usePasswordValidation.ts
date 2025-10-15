export type PasswordValidationResult = {
  isValid: boolean;
  message: string;
};

export function validatePasswordStrength(
  password: string
): PasswordValidationResult {
  if (!password || password.trim().length === 0) {
    return { isValid: false, message: "Vui lòng nhập mật khẩu" };
  }

  const hasMinLength = password.length >= 8;
  const hasDigit = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasMinLength || !hasDigit || !hasUppercase || !hasSpecial) {
    return {
      isValid: false,
      message:
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm ký tự viết hoa, số và ký tự đặc biệt",
    };
  }

  return { isValid: true, message: "" };
}

export function validatePasswordMatch(
  password: string,
  confirm: string
): PasswordValidationResult {
  if (!confirm || confirm.trim().length === 0) {
    return { isValid: false, message: "Vui lòng xác nhận mật khẩu" };
  }
  if (password !== confirm) {
    return { isValid: false, message: "Mật khẩu không khớp" };
  }
  return { isValid: true, message: "" };
}

