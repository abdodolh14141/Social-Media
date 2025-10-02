"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = params.get("token");
    if (t) setToken(t);
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Missing or invalid token");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("/api/users/resetPassword", {
        token,
        password,
      });
      if (res.status === 200) {
        toast.success("Password updated. You can now log in.");
        router.push("/login");
      } else {
        toast.error(res.data?.message || "Failed to reset password");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to reset password";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl overflow-hidden transition duration-300 hover:shadow-xl">
        <div className="py-6 px-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
          <h2 className="text-3xl font-bold">
            <i className="fas fa-lock mr-2"></i>Create a new password
          </h2>
          <p className="mt-2 text-blue-100">
            Enter a new password for your account
          </p>
        </div>

        <div className="py-8 px-8">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                className="py-3 px-3 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                className="py-3 px-3 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <span className="animate-spin mr-2">
                  <i className="fas fa-spinner"></i>
                </span>
              ) : (
                <i className="fas fa-key mr-2"></i>
              )}
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
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
