"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSocket } from "@/context/SocketContext";
import { Send, Loader2, ArrowLeft, MoreVertical } from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import axios from "axios";

interface Message {
  _id?: string;
  sender: string;
  recipient: string;
  content: string;
  createdAt?: string;
  read?: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  image?: string;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const params = useParams();
  const otherUserId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages and user details
  useEffect(() => {
    if (!session?.user || !otherUserId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch messages
        const msgRes = await fetch(`/api/messages/${otherUserId}`);
        const msgData = await msgRes.json();
        
        if (msgRes.ok) {
          setMessages(msgData.messages || []);
        }

        // Fetch user details
        const userRes = await axios.post("/api/users/searchProfile", { id: otherUserId });
        if (userRes.data?.user) {
             const u = userRes.data.user;
             setOtherUser({
                 name: u.Name,
                 email: u.Email,
                 image: u.UrlImageProfile
             });
        }
      } catch (error) {
        console.error("Error fetching chat data:", error);
        toast.error("Failed to load conversation");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, otherUserId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data: Message) => {
        // Only append if it belongs to this conversation
       if (data.sender === otherUserId || data.recipient === otherUserId) {
          setMessages((prev) => [...prev, data]);
       }
    };

    socket.on("new-message", handleReceiveMessage);

    return () => {
      socket.off("new-message", handleReceiveMessage);
    };
  }, [socket, otherUserId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending || !session?.user) return;

    const content = newMessage.trim();
    setNewMessage(""); 
    setSending(true);

    const senderId = (session.user as any).id || (session.user as any)._id;

    // Optimistic update
    const tempMsg: Message = {
        sender: senderId,
        recipient: otherUserId,
        content: content,
        createdAt: new Date().toISOString(),
    };
    
    // We append nicely, but maybe we should wait for ID? 
    // Usually fine to show optimistically and then replace, but for simplicity just append.
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: senderId,
          recipient: otherUserId,
          content,
        }),
      });

      if (res.ok) {
        const savedMsg = (await res.json()).data;
        // Socket event is emitted by the backend upon successful save
        // No need to emit from client unless using pure socket architecture
        // if (socket) {
        //     socket.emit("send-message", { ...savedMsg, recipientId: otherUserId });
        // }
      } else {
        toast.error("Failed to send message");
        // Remove optimistic message if failed? Or let it be.
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto bg-white dark:bg-zinc-900 shadow-xl rounded-xl overflow-hidden my-4 border border-zinc-200 dark:border-zinc-800">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
          
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold overflow-hidden">
                {otherUser?.image ? (
                   <img src={otherUser.image} alt={otherUser.name} className="h-full w-full object-cover"/>
                ) : (
                    otherUser?.name?.[0]?.toUpperCase() || "?"
                )}
             </div>
             <div>
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {otherUser?.name || "Unknown User"}
                </h2>
                <p className="text-xs text-zinc-500">
                   Active now
                </p>
             </div>
          </div>
        </div>
        <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
           <MoreVertical className="h-5 w-5 text-zinc-400" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950/50">
         {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                 <p>No messages yet.</p>
                 <p className="text-sm">Say hello to start the conversation!</p>
             </div>
         )}
         
         {messages.map((msg, index) => {
             const isMe = msg.sender === ((session?.user as any)?.id || (session?.user as any)?._id);
             return (
                 <div
                   key={msg._id || index} 
                   className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                 >
                    <div 
                      className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
                        isMe 
                          ? "bg-blue-500 text-white rounded-br-none" 
                          : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-none border border-zinc-100 dark:border-zinc-700"
                      }`}
                    >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        {msg.createdAt && (
                           <p className={`text-[10px] mt-1 text-right ${isMe ? "text-blue-100" : "text-zinc-400"}`}>
                             {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        )}
                    </div>
                 </div>
             );
         })}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
         <input
           type="text"
           value={newMessage}
           onChange={(e) => setNewMessage(e.target.value)}
           placeholder="Type a message..."
           className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-400"
         />
         <button 
           type="button" 
           onClick={handleSendMessage}
           disabled={!newMessage.trim() || sending}
           className="p-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 text-white rounded-xl shadow-lg transition-all active:scale-95 flex-shrink-0"
         >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
         </button>
      </form>
    </div>
  );
}
