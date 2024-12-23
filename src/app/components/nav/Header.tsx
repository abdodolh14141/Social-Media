"use client";

import { useSession } from "next-auth/react"; // Import useSession from next-auth
import Link from "next/link";
import Logout from "../buttons/logoutButton";
import { useEffect, useState } from "react";

export default function Header() {
  const { data: session, status } = useSession(); // Get session data using useSession
  const [name, setName] = useState("");

  // Set the name when the session changes
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setName(session?.user?.name as string);
    } else {
      setName(""); // Clear name if not authenticated
    }
  }, [session, status]); // Dependency array

  return (
    <>
      <header
        className="bg-white border-b flex sticky z-10 justify-between opacity-40 rounded-lg
      p-2"
      >
        <div className="max-w-3xl flex justify-center">
          <div className="flex gap-6">
            <Link href="/" className="text-2xl">
              LinkList
            </Link>
            <nav className="flex items-center gap-4 text-slate-500 text-sm">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
            </nav>
          </div>
        </div>

        <nav className="flex items-center gap-4 text-sm text-slate-500">
          {session?.user ? (
            <>
              <Link href="/account">Hello, {name}</Link>
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
