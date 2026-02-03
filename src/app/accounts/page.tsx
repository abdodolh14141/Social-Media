"use client";

import { useCallback, useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, ShieldCheck, Search, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useElysiaSession } from "../libs/hooks/useElysiaSession";

interface User {
  _id: string;
  Name: string;
  image?: string;
  Email: string;
  isAdmin?: boolean;
}

export default function Accounts() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [followingId, setFollowingId] = useState<string | null>(null);

  const { session } = useElysiaSession();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get("/api/users/getUsers");
      setUsers(Array.isArray(response.data.users) ? response.data.users : []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Could not load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((user) =>
    user.Name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const followUser = async (userId: string) => {
    if (!session?.data?.user?.email) {
      return toast.error("Please login to follow users");
    }

    setFollowingId(userId); // Start loading for this specific button
    try {
      const response = await axios.post("/api/users/AddFollow", {
        FollowByEmail: session.data.user.email,
        AccountId: userId,
      });

      if (response.status === 200) {
        toast.success("Connection successful!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to follow user");
    } finally {
      setFollowingId(null); // Stop loading
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen">
      <Toaster richColors position="bottom-right" />

      {/* Header section with slide-down animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
            Explore Community
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Join {users.length} creative minds around the world.
          </p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by name..."
            className="pl-12 pr-6 py-3 bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl w-full md:w-80 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-3xl"
            />
          ))}
        </div>
      ) : (
        <motion.div
          layout // Smoothly re-arranges grid when searching
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 hover:border-blue-500/50 transition-colors shadow-sm hover:shadow-xl hover:shadow-blue-500/10"
              >
                <Link
                  href={`/profileAccount/${user._id}`}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-4">
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.05 }}
                      className="w-24 h-24 rounded-[1.8rem] overflow-hidden ring-4 ring-zinc-50 dark:ring-zinc-800"
                    >
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.Name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-white text-3xl font-bold">
                          {user.Name[0]}
                        </div>
                      )}
                    </motion.div>
                    {user.isAdmin && (
                      <div className="absolute -bottom-2 -right-2 bg-blue-500 p-1.5 rounded-xl border-4 border-white dark:border-zinc-900 shadow-lg">
                        <ShieldCheck className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-xl text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors">
                    {user.Name}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6 truncate w-full text-center">
                    {user.Email}
                  </p>
                </Link>

                <button
                  onClick={() => followUser(user._id)}
                  disabled={followingId === user._id}
                  className="w-full py-3 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {followingId === user._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32"
        >
          <div className="inline-flex p-6 bg-zinc-100 dark:bg-zinc-900 rounded-full mb-4">
            <Search className="w-10 h-10 text-zinc-400" />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-white">
            No members found
          </p>
          <p className="text-zinc-500">
            Try searching for a different name or keyword.
          </p>
        </motion.div>
      )}
    </div>
  );
}
