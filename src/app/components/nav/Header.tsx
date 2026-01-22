"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Logout from "../buttons/logoutButton";
import { usePathname } from "next/navigation";
import { User, Home, Info, PlusCircle, MessageSquare } from "lucide-react";
import { useSocket } from "@/context/SocketContext";

// Define Props for NavLink
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon: React.ElementType;
}

export default function Header() {
  const { data: session, status } = useSession();
  const { unreadCount } = useSocket();
  const pathname = usePathname();

  const isLoading = status === "loading";

  const NavLink = ({ href, children, icon: Icon }: NavLinkProps) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? "bg-blue-500/10 text-blue-500"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        }`}
      >
        <Icon size={18} />
        <span className="hidden md:inline">{children}</span>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Logo & Core Nav */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 transition-transform hover:scale-105"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
              <span className="text-xl font-black">S</span>
            </div>
            <span className="hidden text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:block">
              SocialSpace
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink href="/" icon={Home}>Feed</NavLink>
            <NavLink href="/about" icon={Info}>About</NavLink>
          </nav>
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/messages"
                className="relative group flex items-center justify-center p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Messages"
              >
                <MessageSquare size={20} className="text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-950 animate-in zoom-in duration-300">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href="/newPost"
                className="hidden items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-black md:flex"
              >
                <PlusCircle size={16} />
                New Post
              </Link>

              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

              <Link
                href={`/ProfileUser/${session?.user?.id || ""}`} // Ensure ID is present
                className="group flex items-center gap-2"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt="User Profile"
                    className="h-9 w-9 rounded-full border-2 border-transparent object-cover transition-all group-hover:border-blue-500"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 transition-all group-hover:ring-2 group-hover:ring-blue-500">
                    <User size={20} className="text-zinc-500" />
                  </div>
                )}
              </Link>

              <Logout />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signin"
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95"
              >
                Join Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}