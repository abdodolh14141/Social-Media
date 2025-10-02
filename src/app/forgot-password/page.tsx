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

    // Basic email validation
    if (!emailInput || !/\S+@\S+\.\S+/.test(emailInput)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Fixed: Changed from { emailInput } to match API expectation
      const res = await axios.post("/api/send-email", {
        to: emailInput,
        subject: "Password Reset Request",
      });

      if (res.status === 200) {
        toast.success("Check your email for reset instructions");
        setEmailInput("");
        // Consider redirecting to a confirmation page instead of reset-password
        router.push("/login"); // Changed to login as reset-password might be confusing
      }
    } catch (error: any) {
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Something went wrong. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br px-4">
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
                  className="py-3 pl-10 pr-3 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300"
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
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">
                      <i className="fas fa-spinner"></i>
                    </span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-key mr-2"></i>
                    Reset Password
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
              className="text-blue-600 hover:text-blue-500 font-medium transition duration-300"
            >
              <i className="fas fa-arrow-left mr-1"></i> Back to login
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
