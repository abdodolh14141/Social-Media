"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ResetPass() {
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
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
      const res = await axios.post("/api/send-email", {
        to: emailInput,
        subject: "Password Reset Request",
        // You can also pass custom HTML content here if needed
      });

      if (res.status === 200) {
        toast.success("Password reset instructions sent to your email");
        setEmailInput("");
        // Redirect to confirmation page or login
        router.push("/login");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full shadow-2xl bg-white rounded-2xl overflow-hidden transition duration-300 hover:shadow-xl">
        <div className="py-6 px-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
          <h2 className="text-3xl font-bold">
            <i className="fas fa-lock mr-2"></i>Reset Password
          </h2>
          <p className="mt-2 text-blue-100">
            Enter your email and we'll send a reset link
          </p>
        </div>

        <div className="py-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
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
                  className="py-3 pl-10 pr-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
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
                    Send Reset Link
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
