"use client";

import { useEffect, useState, useRef } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  _id?: string;
  sender: string;
  recipient: string;
  content: string;
  createdAt?: string;
  read?: boolean;
}

export default function ChatPage() {
  const { data: session } = useElysiaSession();
  const { socket } = useSocket();
  const params = useParams();
  const otherUserId = params.id as string;
  const currentUserId =
    (session?.user as any)?.id || (session?.user as any)?._id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Fetch initial messages
  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", otherUserId],
    queryFn: async () => {
      const res = await axios.get(`/api/messages/${otherUserId}`);
      const fetchedMessages = res.data.messages || [];
      setMessages(fetchedMessages);
      return fetchedMessages;
    },
    enabled: !!otherUserId && !!currentUserId,
  });

  // Fetch other user profile
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

  // Socket Logic
  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = (data: Message) => {
      // Ensure the message belongs to THIS conversation
      if (data.sender === otherUserId || data.recipient === otherUserId) {
        setMessages((prev) => [...prev, data]);
      }
    };
    socket.on("new-message", handleReceiveMessage);
    return () => {
      socket.off("new-message", handleReceiveMessage);
    };
  }, [socket, otherUserId]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending || !currentUserId) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    const tempMsg: Message = {
      sender: currentUserId,
      recipient: otherUserId,
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await axios.post("/api/messages", {
        sender: currentUserId,
        recipient: otherUserId,
        content,
      });

      if (res.data.success && socket) {
        socket.emit("send-message", {
          ...res.data.data,
          recipientId: otherUserId,
        });
      }
    } catch (error) {
      toast.error("Message failed to send");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (messagesLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-zinc-500 font-medium animate-pulse">
          Securing your connection...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-20px)] max-w-2xl mx-auto bg-white dark:bg-zinc-950 shadow-2xl rounded-3xl overflow-hidden my-2 border border-zinc-200 dark:border-zinc-800">
      <Toaster position="top-center" richColors />

      {/* Modern Header */}
      <header className="p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </Link>

          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px]">
                <div className="h-full w-full rounded-[14px] bg-white dark:bg-zinc-900 overflow-hidden flex items-center justify-center">
                  {userData?.image ? (
                    <img
                      src={userData.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-blue-500">
                      {userData?.Name?.[0]}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                {userData?.Name || "User"}
              </h2>
              <p className="text-[11px] text-green-500 font-bold uppercase tracking-wider mt-1">
                Online
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors">
            <Video className="h-5 w-5" />
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide bg-zinc-50/50 dark:bg-zinc-900/20">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-2">
              <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-2">
                <User className="h-8 w-8 opacity-20" />
              </div>
              <p className="font-medium text-sm">
                Encryption active. Start your chat safely.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender === currentUserId;
              return (
                <motion.div
                  key={msg._id || index}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%]`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-[20px] shadow-sm text-sm leading-relaxed ${
                        isMe
                          ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/10"
                          : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-none border border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.createdAt && (
                      <span className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-tighter mx-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-[22px] border border-transparent focus-within:border-blue-500/50 transition-all"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Aa"
            className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-100 px-4 py-2.5 outline-none text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:grayscale text-white rounded-full shadow-lg transition-all active:scale-90"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4 fill-current" />
            )}
          </button>
        </form>
      </footer>
    </div>
  );
}
