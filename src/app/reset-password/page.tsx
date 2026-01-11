"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

// --- Types & Constants ---
interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

const PASSWORD_REGEX = {
  lower: /(?=.*[a-z])/,
  upper: /(?=.*[A-Z])/,
  number: /(?=.*\d)/,
  special: /(?=.*[@$!%*?&])/,
};

// --- Helper Functions ---
const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!PASSWORD_REGEX.lower.test(password)) errors.push("One lowercase letter");
  if (!PASSWORD_REGEX.upper.test(password)) errors.push("One uppercase letter");
  if (!PASSWORD_REGEX.number.test(password)) errors.push("One number");
  if (!PASSWORD_REGEX.special.test(password))
    errors.push("One special character (@$!%*?&)");

  return { isValid: errors.length === 0, errors };
};

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();

  // State
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

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setVerifying(true);
    try {
      const { data } = await axios.put("/api/send-email", {
        email,
        code: verificationCode,
      });
      if (data.success) {
        setCodeVerified(true);
        toast.success("Code verified! Set your new password.");
      }
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error
        : "Verification failed";
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      await axios.post("/api/send-email", {
        to: email,
        subject: "Password Reset Verification Code",
      });
      toast.success("A new code has been sent.");
      setVerificationCode("");
    } catch (err) {
      toast.error("Failed to resend code. Please try again later.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const { isValid, errors } = validatePassword(password);
    if (!isValid) return toast.error(errors[0]);
    if (password !== confirmPassword)
      return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/reset-password", {
        email,
        verificationCode,
        password,
      });
      if (res.status === 200) {
        toast.success("Password updated! Redirecting...");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err) {
      toast.error("An error occurred. Please request a new code.");
    } finally {
      setLoading(false);
    }
  };

  // UI logic
  const strengthData = (() => {
    if (!password)
      return {
        label: "Empty",
        color: "text-gray-400",
        bg: "bg-gray-200",
        width: "0%",
      };
    const { errors } = validatePassword(password);
    const score = 5 - errors.length;
    if (score <= 2)
      return {
        label: "Weak",
        color: "text-red-500",
        bg: "bg-red-500",
        width: "33%",
      };
    if (score <= 4)
      return {
        label: "Medium",
        color: "text-yellow-500",
        bg: "bg-yellow-500",
        width: "66%",
      };
    return {
      label: "Strong",
      color: "text-green-500",
      bg: "bg-green-500",
      width: "100%",
    };
  })();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {codeVerified ? "New Password" : "Verify Email"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {email ? `Resetting for ${email}` : "Verify your identity"}
          </p>
        </div>

        {!codeVerified ? (
          <div className="mt-8 space-y-6">
            <input
              type="text"
              placeholder="000000"
              className="block w-full text-center text-3xl tracking-widest font-mono border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(
                  e.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
            />
            <button
              onClick={handleVerifyCode}
              disabled={verifying || verificationCode.length < 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {verifying ? "Verifying..." : "Verify Code"}
            </button>
            <button
              onClick={handleResendCode}
              disabled={resendLoading}
              className="w-full text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Resend Code
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="New Password"
                className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Strength Indicator */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500">Strength:</span>
                <span className={strengthData.color}>{strengthData.label}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${strengthData.bg}`}
                  style={{ width: strengthData.width }}
                ></div>
              </div>
            </div>

            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Confirm Password"
              className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              type="submit"
              disabled={loading || password !== confirmPassword}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? "Saving..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
