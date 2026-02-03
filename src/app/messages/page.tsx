"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageSquarePlus, Search, User, MoreHorizontal } from "lucide-react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Conversation {
  _id: string;
  userDetails: {
    Name: string;
    Email: string;
    image?: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    read: boolean;
    sender: string;
  };
}

export default function MessagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axios.get("/api/messages/conversations");
      return res.data as {
        conversations: Conversation[];
        currentUserId: string;
      };
    },
    refetchInterval: 5000,
  });

  const conversations = data?.conversations;
  const currentUserId = data?.currentUserId;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">
        <div className="h-12 w-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl mb-8" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-24 w-full bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-[32px]"
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto p-4 md:p-8 min-h-screen"
    >
      {/* --- Header Section --- */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
            Inbox
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
              {conversations?.length ?? 0} Active
            </p>
          </div>
        </div>
        <Link
          href="/searchAccounts"
          className="p-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95"
        >
          <MessageSquarePlus className="h-6 w-6" />
        </Link>
      </div>

      {/* --- Chat List --- */}
      {!conversations || conversations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[48px] bg-zinc-50/50 dark:bg-zinc-900/10"
        >
          <div className="bg-white dark:bg-zinc-800 p-8 rounded-full shadow-2xl mb-6">
            <Search className="h-12 w-12 text-blue-500" />
          </div>
          <h3 className="font-black text-2xl text-zinc-900 dark:text-white">
            Start something new
          </h3>
          <p className="text-zinc-500 text-center max-w-xs mt-3 mb-8 font-medium">
            Your inbox is looking a bit lonely. Message a friend to get things
            started!
          </p>
          <Link
            href="/searchAccounts"
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
          >
            Find People
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {conversations.map((conv, index) => {
              const isMe = conv.lastMessage.sender === currentUserId;
              const isUnread = !conv.lastMessage.read && !isMe;
              const messageDate = new Date(conv.lastMessage.createdAt);

              return (
                <motion.div
                  layout
                  key={conv._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Link
                    href={`/messages/${conv._id}`}
                    className={`group relative flex items-center p-5 rounded-[32px] border transition-all duration-300 ${
                      isUnread
                        ? "bg-blue-50/50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-800 shadow-sm"
                        : "bg-white dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {/* Avatar with Status */}
                    <div className="relative mr-5 flex-shrink-0">
                      <div className="h-16 w-16 rounded-[22px] overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 shadow-inner group-hover:scale-105 transition-transform duration-500">
                        {conv.userDetails.image ? (
                          <Image
                            src={conv.userDetails.image}
                            alt="Avatar"
                            width={64}
                            height={64}
                            className="object-cover h-full w-full"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <User className="text-zinc-400 h-8 w-8" />
                          </div>
                        )}
                      </div>
                      {isUnread && (
                        <div className="absolute -top-1 -right-1 flex h-5 w-5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-4 border-white dark:border-zinc-900" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3
                          className={`font-black truncate text-lg ${isUnread ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"}`}
                        >
                          {conv.userDetails.Name}
                        </h3>
                        <span className="text-[11px] text-zinc-400 font-black uppercase tracking-widest whitespace-nowrap ml-4">
                          {formatDistanceToNowStrict(messageDate)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p
                          className={`text-sm truncate pr-4 ${isUnread ? "text-zinc-900 dark:text-zinc-100 font-bold" : "text-zinc-500 font-medium"}`}
                        >
                          {isMe && (
                            <span className="text-blue-500 font-black text-[10px] uppercase mr-1.5 px-1.5 py-0.5 bg-blue-500/10 rounded-md">
                              You
                            </span>
                          )}
                          {conv.lastMessage.content}
                        </p>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-5 w-5 text-zinc-400" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
