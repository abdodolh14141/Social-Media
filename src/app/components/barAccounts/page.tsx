"use client";

import axios from "axios";
import Link from "next/link";
import useSWR from "swr";
import { motion } from "framer-motion";

interface User {
  _id: string;
  Name: string;
  image?: string;
  Email: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data.users);

export default function BarUsers() {
  const {
    data: users,
    error,
    isLoading,
  } = useSWR<User[]>("/api/users/getUsers", fetcher);

  if (error) return null;

  return (
    <div className="w-full max-w-8xl mx-auto bg-white dark:bg-[#161617] rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex justify-between items-center">
        <h2 className="text-sm font-bold text-center uppercase tracking-wider text-zinc-500">
          Accounts
        </h2>
        <Link
          href="/accounts"
          className="text-xs font-semibold text-blue-500 hover:underline"
        >
          See all
        </Link>
      </div>

      {/* Animated Horizontal Scroll Container */}
      <div className="flex flex-row max-w-8xl mx-auto items-center justify-around gap-2 overflow-x-auto px-5 pb-5 no-scrollbar cursor-grab active:cursor-grabbing">
        {isLoading
          ? [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 animate-pulse"
              >
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-2 w-12 bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            ))
          : users?.map((user, index) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, x: 20 }} // Start slightly to the right
                animate={{ opacity: 1, x: 0 }} // Animate to position
                transition={{
                  duration: 0.4,
                  delay: index * 0.1, // Stagger effect
                  ease: "easeOut",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer max-w-8xl"
              >
                <Link
                  href={`/profileAccount/${user._id}`}
                  className="flex flex-col items-center gap-2 group max-w-7xl"
                >
                  {/* Avatar with Gradient Border */}
                  <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
                    <div className="p-[2px] bg-white dark:bg-[#161617] rounded-full">
                      <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.Name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold uppercase text-lg">
                            {user.Name[0]}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Small "Add" or "Online" badge */}
                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-blue-500 border-2 border-white dark:border-[#161617] rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">
                        +
                      </span>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="flex flex-col items-center text-center">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate w-20">
                      {user.Name.split(" ")[0]}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
      </div>
    </div>
  );
}
