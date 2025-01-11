"use client";

import { useSession } from "next-auth/react"; // Import useSession from next-auth
import Link from "next/link";
import Logout from "../buttons/logoutButton";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";

export default function Header() {
  const { data: session, status } = useSession(); // Get session data using useSession
  const [name, setName] = useState("");
  const [getIdUser, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const getIdAccount = useCallback(async () => {
    const userName = session?.user?.name;
    setLoading(true);
    try {
      const res = await axios.post("/api/users/searchUsers", {
        name: userName,
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

  // Set the name when the session changes
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setName(session?.user?.name as string);
      getIdAccount();
    } else {
      setName(""); // Clear name if not authenticated
    }
  }, [session, status, getIdAccount]); // Dependency array

  return (
    <>
      <Toaster />
      <header className="border-b flex sticky z-10 justify-between rounded-lg p-2">
        <div className="max-w-3xl flex text-white justify-center">
          <div className="flex gap-6">
            <Link href="/" className="text-2xl">
              LinkList
            </Link>
            <nav className="flex items-center gap-4 text-white text-lg hover:scale-105">
              <Link href="/about">About</Link>
            </nav>
          </div>
        </div>

        <nav className="flex items-center gap-4 text-sm text-white">
          {loading ? (
            <span className="font-bold text-lg">Loading...</span>
          ) : session?.user ? (
            <>
              <Link
                className="font-bold text-black p-1 rounded-lg text-lg hover:scale-110"
                href={`/ProfileUser/${getIdUser}`}
              >
                My Account
              </Link>
              <Logout />
            </>
          ) : (
            <>
              <Link href="/login">Sign In</Link>
              <Link href="/signin">Create Account</Link>
            </>
          )}
        </nav>
      </header>
    </>
  );
}
