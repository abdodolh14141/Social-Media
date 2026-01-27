"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ResetPass() {
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenSent, setTokenSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput || !emailRegex.test(emailInput)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/api/email/send", {
        to: emailInput,
      });

      if (res.status === 200) {
        toast.success("Password reset instructions sent to your email");
        setTokenSent(true);
      }
    } catch (error: any) {
      console.error("Reset password error:", error);

      let errorMsg = "Something went wrong. Please try again.";

      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          errorMsg = error.response.data.error;
        } else if (error.code === "ECONNREFUSED") {
          errorMsg = "Unable to connect to server. Please try again later.";
        } else if (error.code === "NETWORK_ERROR") {
          errorMsg = "Network error. Please check your connection.";
        }
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      toast.error("Please enter the verification code");
      return;
    }

    setVerifying(true);

    try {
      // Here you would typically verify the code with your backend
      // For now, we'll simulate successful verification
      const isValid = await verifyTokenWithBackend(
        verificationCode,
        emailInput
      );

      if (isValid) {
        toast.success("Verification successful! Redirecting...");

        // Redirect to reset password page with code as parameter
        router.push(
          `/reset-password?code=${verificationCode}&email=${encodeURIComponent(
            emailInput
          )}`
        );
      } else {
        toast.error("Invalid verification code. Please try again.");
      }
    } catch (error) {
      toast.error("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const generateToken = (): string => {
    // Generate a random token (in production, use a more secure method)
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  const verifyTokenWithBackend = async (
    code: string,
    email: string
  ): Promise<boolean> => {
    try {
      const res = await axios.post("/api/email/verify", {
        email,
        code,
      });
      return res.status === 200;
    } catch (error) {
      console.error("Verification error:", error);
      return false;
    }
  };

  const resendVerification = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/email/send", {
        to: emailInput,
      });

      if (res.status === 200) {
        toast.success("New verification code sent to your email");
        setVerificationCode(""); // Clear previous code
      }
    } catch (error) {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (tokenSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-4xl w-full shadow-2xl bg-white rounded-2xl text-gray-800 overflow-hidden transition duration-300 hover:shadow-xl">
          <div className="py-6 px-8 bg-gradient-to-r from-green-600 to-emerald-700 text-center">
            <h2 className="text-3xl font-bold text-white">
              <i className="fas fa-envelope mr-2"></i>Check Your Email
            </h2>
            <p className="mt-2 text-green-100">
              We sent a verification code to your email
            </p>
          </div>

          <div className="py-8 px-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-envelope-open text-green-600 text-2xl"></i>
              </div>
              <p className="text-sm text-gray-600">
                We sent a 6-digit verification code to:
                <br />
                <strong className="text-gray-800">{emailInput}</strong>
              </p>
            </div>

            <form onSubmit={handleVerification} className="space-y-6">
              <div>
                <label
                  htmlFor="verificationCode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Verification Code
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-shield-alt text-gray-400"></i>
                  </div>
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    aria-label="6-digit verification code"
                    className="py-3 pl-10 pr-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black transition duration-300 text-center text-lg font-mono"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => {
                      // Only allow numbers and limit to 6 digits
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setVerificationCode(value);
                    }}
                    disabled={verifying}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={verifying || verificationCode.length !== 6}
                  className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 ${
                    verifying || verificationCode.length !== 6
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-105"
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
                  onClick={resendVerification}
                  disabled={loading}
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Resend Code"}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setTokenSent(false);
                  setVerificationCode("");
                }}
                className="text-blue-600 hover:text-blue-500 font-medium transition duration-300 inline-flex items-center"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Use different email
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br  px-4">
      <div className="max-w-5xl w-full shadow-2xl bg-white rounded-2xl text-gray-800 overflow-hidden transition duration-300 hover:shadow-xl">
        <div className="py-6 px-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-center">
          <h2 className="text-3xl font-bold text-white">
            <i className="fas fa-lock mr-2"></i>Reset Password
          </h2>
          <p className="mt-2 text-blue-100">
            Enter your email and we'll send a verification code
          </p>
        </div>

        <div className="py-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-gray-400"></i>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  aria-label="Email for password reset"
                  autoComplete="email"
                  className="py-3 pl-10 pr-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition duration-300"
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ${
                  loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
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
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-key mr-2"></i>
                    Send Verification Code
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-500 mb-2">
              <span>Remember your password?</span>
            </div>
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-500 font-medium transition duration-300 inline-flex items-center"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to login
            </a>
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
