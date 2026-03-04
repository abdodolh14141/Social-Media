"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageSquarePlus, Search, User, ArrowRight } from "lucide-react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";

export default function MessagesPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axios.get("/api/messages/conversations");
      return res.data;
    },
    refetchInterval: 10000,
  });

  const conversations = data?.conversations || [];
  const currentUserId = data?.currentUserId;

  const filteredConversations = useMemo(() => {
    return conversations.filter((c: any) =>
      c.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  if (!mounted || isLoading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Messages</h1>
            <p className="text-xs font-bold text-blue-500 uppercase mt-1">Active Threads ({conversations.length})</p>
          </div>
          <Link href="/searchAccounts" className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg hover:scale-105 transition-transform">
            <MessageSquarePlus className="h-6 w-6" />
          </Link>
        </header>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 rounded-2xl border-none ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredConversations.map((conv: any) => {
              const isMe = conv.lastMessage.senderId === currentUserId;
              const hasUnread = conv.unreadCount > 0;

              return (
                <motion.div key={conv._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Link href={`/messages/${conv._id}`} className={`group flex items-center p-4 rounded-3xl border transition-all ${hasUnread ? "bg-white border-blue-100 shadow-md" : "border-transparent hover:bg-zinc-100/50"}`}>
                    <div className="relative">
                      <div className="h-14 w-14 rounded-2xl overflow-hidden bg-zinc-200">
                        {conv.contactImage ? <Image src={conv.contactImage} alt="" width={56} height={56} className="object-cover h-full w-full" /> : <User className="m-4 text-zinc-400" />}
                      </div>
                      {hasUnread && (
                        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#fafafa]">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-zinc-900 truncate">{conv.contactName}</h3>
                        <span className="text-[10px] text-zinc-400">{formatDistanceToNowStrict(new Date(conv.lastMessage.createdAt))}</span>
                      </div>
                      <p className={`text-sm truncate ${hasUnread ? "text-zinc-900 font-bold" : "text-zinc-500"}`}>
                        {isMe && <span className="text-blue-500 mr-1">You:</span>}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 text-blue-500 transition-all" />
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-8 animate-pulse">
      <div className="h-10 w-48 bg-zinc-200 rounded-xl mb-8" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-4 mb-4 p-4"><div className="h-14 w-14 bg-zinc-200 rounded-2xl" /><div className="flex-1 space-y-2 mt-2"><div className="h-4 w-32 bg-zinc-200 rounded-lg" /><div className="h-3 w-full bg-zinc-100 rounded-lg" /></div></div>
      ))}
    </div>
  );
}