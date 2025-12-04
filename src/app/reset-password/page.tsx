"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [params]);

  const validatePassword = (
    password: string
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push(
        "Password must contain at least one special character (@$!%*?&)"
      );
    }

    return { isValid: errors.length === 0, errors };
  };

  const getPasswordStrength = (
    password: string
  ): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: "Empty", color: "gray" };

    const { errors } = validatePassword(password);
    const strength = 5 - errors.length;

    if (strength <= 1) return { strength, label: "Weak", color: "red" };
    if (strength <= 3) return { strength, label: "Medium", color: "yellow" };
    return { strength, label: "Strong", color: "green" };
  };

  const verifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setVerifying(true);
    try {
      const res = await axios.put("/api/send-email", {
        email,
        code: verificationCode,
      });

      if (res.data.success) {
        setCodeVerified(true);
        toast.success("Code verified successfully! Now set your new password.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Invalid verification code";
      toast.error(msg);

      // Clear code if too many attempts
      if (err.response?.status === 429) {
        setVerificationCode("");
      }
    } finally {
      setVerifying(false);
    }
  };

  const resendCode = async () => {
    setResendLoading(true);
    try {
      const res = await axios.post("/api/send-email", {
        to: email,
        subject: "Password Reset Verification Code",
      });

      if (res.data.success) {
        toast.success("New verification code sent to your email");
        setVerificationCode("");
        setCodeVerified(false);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to resend code";
      toast.error(msg);
    } finally {
      setResendLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!codeVerified) {
      toast.error("Please verify your code first");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const { isValid, errors } = validatePassword(password);
    if (!isValid) {
      toast.error(errors[0]);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("/api/auth/reset-password", {
        email,
        verificationCode,
        password,
      });

      if (res.status === 200) {
        toast.success(
          "Password updated successfully! You can now log in with your new password."
        );
        // Clear form
        setPassword("");
        setConfirmPassword("");
        setVerificationCode("");
        // Redirect to login after short delay
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to reset password";

      if (err.response?.status === 410) {
        toast.error("Verification code has expired. Please request a new one.");
        setCodeVerified(false);
        setVerificationCode("");
      } else if (err.response?.status === 404) {
        toast.error("Invalid verification code. Please request a new code.");
        setCodeVerified(false);
        setVerificationCode("");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl overflow-hidden transition duration-300 hover:shadow-xl">
        <div className="py-6 px-8 bg-gradient-to-r from-green-600 to-emerald-700 text-white text-center">
          <h2 className="text-3xl font-bold">
            <i className="fas fa-lock mr-2"></i>
            {codeVerified ? "Create New Password" : "Verify Code"}
          </h2>
          <p className="mt-2 text-green-100">
            {email && `Reset password for ${email}`}
          </p>
        </div>

        <div className="py-8 px-8">
          {!codeVerified ? (
            // Verification Code Section
            <div className="space-y-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-shield-alt text-blue-600 text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Enter Verification Code
                </h3>
                <p className="text-gray-600">
                  We sent a 6-digit code to your email
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="py-3 px-3 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 text-center text-2xl font-mono tracking-widest"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setVerificationCode(value);
                      // Auto-verify when 6 digits are entered
                      if (value.length === 6) {
                        setTimeout(verifyCode, 100);
                      }
                    }}
                    placeholder="000000"
                    disabled={verifying}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={verifyCode}
                  disabled={verifying || verificationCode.length !== 6}
                  className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition duration-300 ${
                    verifying || verificationCode.length !== 6
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:scale-105"
                  }`}
                >
                  {verifying ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Verify Code
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resendCode}
                  disabled={resendLoading}
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 disabled:opacity-50"
                >
                  {resendLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700 inline"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-redo mr-2"></i>
                      Resend Code
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Password Reset Section
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check text-green-600 text-2xl"></i>
                </div>
                <p className="text-green-600 font-medium mb-2">
                  ✓ Code Verified Successfully
                </p>
                <p className="text-gray-600">Now create your new password</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="py-3 px-3 pr-10 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i
                      className={`fas ${
                        showPassword ? "fa-eye-slash" : "fa-eye"
                      } text-gray-400 hover:text-gray-600`}
                    ></i>
                  </button>
                </div>

                {password && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">
                        Password strength:
                      </span>
                      <span
                        className={`text-xs font-medium text-${passwordStrength.color}-600`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full bg-${passwordStrength.color}-500 transition-all duration-300`}
                        style={{
                          width: `${(passwordStrength.strength / 5) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <ul className="text-xs text-gray-500 mt-2 space-y-1">
                      <li
                        className={password.length >= 8 ? "text-green-600" : ""}
                      >
                        ✓ At least 8 characters
                      </li>
                      <li
                        className={
                          /(?=.*[a-z])/.test(password) ? "text-green-600" : ""
                        }
                      >
                        ✓ One lowercase letter
                      </li>
                      <li
                        className={
                          /(?=.*[A-Z])/.test(password) ? "text-green-600" : ""
                        }
                      >
                        ✓ One uppercase letter
                      </li>
                      <li
                        className={
                          /(?=.*\d)/.test(password) ? "text-green-600" : ""
                        }
                      >
                        ✓ One number
                      </li>
                      <li
                        className={
                          /(?=.*[@$!%*?&])/.test(password)
                            ? "text-green-600"
                            : ""
                        }
                      >
                        ✓ One special character
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="py-3 px-3 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                  placeholder="Confirm your new password"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-600 text-xs mt-1">
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-green-600 text-xs mt-1">
                    ✓ Passwords match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || password !== confirmPassword}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition duration-300 ${
                  loading || password !== confirmPassword
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 hover:scale-105"
                }`}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating Password...
                  </>
                ) : (
                  <>
                    <i className="fas fa-key mr-2"></i>
                    Update Password
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-blue-600 hover:text-blue-500 font-medium transition duration-300 inline-flex items-center"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Login
            </button>
          </div>
        </div>

        <div className="py-4 bg-gray-50 rounded-b-2xl text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
