"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Logout from "../buttons/logoutButton";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";

export default function Header() {
  const { data: session, status } = useSession(); // Session data
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch the user ID based on the session
  const fetchUserId = useCallback(async () => {
    if (!session?.user?.name) return;
    setLoading(true);
    try {
      const res = await axios.post("/api/users/searchUsers", {
        name: session.user.name,
      });
      if (res.data.success) {
        setUserId(res.data.user[0]._id);
      }
    } catch (error) {
      console.error("Error fetching user ID:", error);
      toast.error("Failed to fetch user ID. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchUserId();
    }
  }, [status, session, fetchUserId]);

  return (
    <>
      <Toaster />
      <header className="flex items-center justify-between bg-gray-800 text-white rounded-md p-2 sticky top-0 z-10 shadow-md">
        {/* Logo and Navigation Links */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-2xl font-semibold hover:scale-105 transition-transform"
          >
            Social Media
          </Link>
          <nav className="flex items-center gap-4 text-lg">
            <Link
              href="/about"
              className="hover:text-blue-400 transition-colors"
            >
              About
            </Link>
          </nav>
        </div>

        {/* Website Icon */}
        <img
          src="https://cdn-icons-png.flaticon.com/512/2065/2065157.png"
          alt="Website Icon"
          className="w-10 h-10"
        />

        {/* User Actions */}
        <nav className="flex items-center gap-4">
          {loading ? (
            <span className="text-gray-300">Loading...</span>
          ) : session?.user ? (
            <>
              <Link
                href={`/ProfileUser/${userId}`}
                className="text-lg font-bold bg-blue-500 px-3 py-1 rounded-lg hover:scale-105 transition-transform"
              >
                My Account
              </Link>
              <Logout />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hover:text-blue-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signin"
                className="bg-blue-500 px-3 py-1 rounded-lg text-white hover:scale-105 transition-transform"
              >
                Create Account
              </Link>
            </>
          )}
        </nav>
      </header>
    </>
  );
}
