"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useElysiaSession } from "@/app/libs/hooks/useElysiaSession";
import { useSocket } from "@/context/SocketContext";
import { useQuery } from "@tanstack/react-query";
import {
  Send,
  Loader2,
  ArrowLeft,
  MoreVertical,
  User,
  Phone,
  Video,
  ShieldCheck,
  CheckCheck,
  ImageIcon,
  Smile,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  _id?: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt?: string;
  read?: boolean;
}

export default function ChatPage() {
  const { data: session } = useElysiaSession();
  const { socket } = useSocket();
  const params = useParams();
  const otherUserId = params?.id as string;

  const currentUserId =
    (session?.user as any)?.id || (session?.user as any)?._id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = useCallback(
    (behavior: "smooth" | "auto" = "smooth") => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior });
      }, 50);
    },
    [],
  );

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages.length, scrollToBottom]);

  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", otherUserId],
    queryFn: async () => {
      const res = await axios.get(`/api/messages/${otherUserId}`);
      const fetchedMessages = res.data.messages || [];
      setMessages(fetchedMessages);
      // Scroll to bottom after initial load
      setTimeout(() => scrollToBottom("auto"), 100);
      return fetchedMessages;
    },
    enabled: !!otherUserId && !!currentUserId,
  });

  const { data: userData } = useQuery({
    queryKey: ["userProfile", otherUserId],
    queryFn: async () => {
      const res = await axios.post("/api/users/searchProfile", {
        id: otherUserId,
      });
      return res.data.user;
    },
    enabled: !!otherUserId,
  });

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data: Message) => {
      if (data.senderId === otherUserId) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === data._id)) return prev;
          return [...prev, data];
        });
      }
    };

    socket.on("new-message", handleReceiveMessage);
    return () => {
      socket.off("new-message", handleReceiveMessage);
    };
  }, [socket, otherUserId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending || !currentUserId) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    const tempId = Date.now().toString();
    const tempMsg: Message = {
      _id: tempId,
      senderId: currentUserId,
      recipientId: otherUserId,
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await axios.post("/api/messages", {
        recipient: otherUserId,
        content,
      });

      if (res.data.data) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? res.data.data : msg)),
        );

        if (socket) {
          socket.emit("send-message", {
            ...res.data.data,
            recipientId: otherUserId,
          });
        }
      }
    } catch (error) {
      toast.error("Message failed to send");
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // Helper: should we show a date separator?
  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const curr = messages[index]?.createdAt;
    const prev = messages[index - 1]?.createdAt;
    if (!curr || !prev) return false;
    return (
      new Date(curr).toDateString() !== new Date(prev).toDateString()
    );
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (!mounted || messagesLoading) return <ChatLoadingState />;

  return (
    <div className="flex flex-col h-[100dvh] md:h-[calc(100vh-40px)] max-w-2xl mx-auto bg-white dark:bg-zinc-950 md:shadow-2xl md:rounded-[32px] overflow-hidden md:my-5 border border-zinc-200/60 dark:border-zinc-800/60">
      <Toaster position="top-center" richColors />

      {/* ── Header ── */}
      <header className="relative px-5 py-3.5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all active:scale-95"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-11 w-11 rounded-full overflow-hidden ring-2 ring-blue-100 dark:ring-blue-900/30"
              >
                {userData?.UrlImageProfile ? (
                  <img
                    src={userData.UrlImageProfile}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {userData?.Name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </motion.div>
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px] leading-tight">
                {userData?.Name || "User"}
              </h2>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Online
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all">
            <Phone className="h-[18px] w-[18px]" />
          </button>
          <button className="p-2.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all">
            <Video className="h-[18px] w-[18px]" />
          </button>
          <button className="p-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
            <MoreVertical className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      {/* ── Messages Area ── */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-1"
        style={{
          background:
            "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)",
        }}
      >
        {/* Encryption badge */}
        <div className="flex flex-col items-center mb-6 py-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-zinc-800/50 rounded-full border border-zinc-200/50 dark:border-zinc-700/50">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em]">
              Messages are encrypted
            </p>
          </div>
        </div>

        {/* Empty state */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="h-20 w-20 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
              <MessageCircle className="h-10 w-10 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              No messages yet
            </h3>
            <p className="text-sm text-zinc-400">
              Say hello to {userData?.Name || "this person"}! 👋
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isMe = msg.senderId === currentUserId;
            const showTime =
              index === messages.length - 1 ||
              messages[index + 1]?.senderId !== msg.senderId;
            const showDateSep = shouldShowDateSeparator(index);

            return (
              <div key={msg._id || `${index}-${msg.content}`}>
                {/* Date separator */}
                {showDateSep && msg.createdAt && (
                  <div className="flex items-center justify-center my-5">
                    <span className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 bg-white dark:bg-zinc-800 rounded-full border border-zinc-200/60 dark:border-zinc-700/50 shadow-sm uppercase tracking-wider">
                      {formatDateLabel(msg.createdAt)}
                    </span>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1 ${showTime ? "mb-3" : ""}`}
                >
                  {/* Avatar for other user */}
                  {!isMe && showTime && (
                    <div className="h-7 w-7 rounded-full overflow-hidden mr-2 mt-auto mb-5 flex-shrink-0">
                      {userData?.UrlImageProfile ? (
                        <img
                          src={userData.UrlImageProfile}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                          {userData?.Name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                  )}
                  {!isMe && !showTime && <div className="w-9 flex-shrink-0" />}

                  <div
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}
                  >
                    <div
                      className={`px-4 py-2.5 text-[14px] md:text-[15px] leading-relaxed ${isMe
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md shadow-md shadow-blue-500/15"
                          : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl rounded-bl-md border border-zinc-200/70 dark:border-zinc-700/50 shadow-sm"
                        }`}
                    >
                      {msg.content}
                    </div>
                    {showTime && (
                      <div className="flex items-center gap-1.5 mt-1.5 px-1">
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {msg.createdAt &&
                            new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </span>
                        {isMe && (
                          <CheckCheck
                            className={`h-3.5 w-3.5 ${msg.read ? "text-blue-500" : "text-zinc-300 dark:text-zinc-600"}`}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* ── Input Footer ── */}
      <footer className="p-3 md:p-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800/50">
        <form
          onSubmit={handleSendMessage}
          className="flex items-end gap-2"
        >
          <div className="flex-1 flex items-end bg-zinc-50 dark:bg-zinc-900/60 rounded-[20px] border border-zinc-200/80 dark:border-zinc-800 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-300 dark:focus-within:border-blue-700">
            <button
              type="button"
              className="p-3 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <Smile className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-100 py-3 pr-2 outline-none text-sm md:text-base placeholder:text-zinc-400"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              type="button"
              className="p-3 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
          </div>
          <motion.button
            type="submit"
            disabled={!newMessage.trim() || sending}
            whileTap={{ scale: 0.9 }}
            className="p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-zinc-300 disabled:to-zinc-300 dark:disabled:from-zinc-700 dark:disabled:to-zinc-700 text-white rounded-full shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </motion.button>
        </form>
      </footer>
    </div>
  );
}

function ChatLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 border-4 border-blue-500/10 rounded-full" />
        <div className="absolute h-20 w-20 border-4 border-t-blue-500 rounded-full animate-spin" />
        <User className="h-7 w-7 text-blue-500" />
      </div>
      <p className="mt-10 text-sm font-semibold text-zinc-400 uppercase tracking-[0.2em] animate-pulse">
        Loading messages...
      </p>
    </div>
  );
}
