"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import axios from "axios";

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await axios.get("/api/messages/conversations");
      if (res.status === 200) {
        const data = res.data;
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-zinc-800 dark:text-zinc-100">Messages</h1>
      
      {conversations.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">
          <p>No messages yet.</p>
          <Link href="/searchAccounts" className="text-blue-500 hover:underline mt-2 inline-block">
            Start a conversation
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const isUnread = !conv.lastMessage.read && conv.lastMessage.sender === conv._id;
            
            return (
              <Link
                href={`/messages/${conv._id}`}
                key={conv._id}
                className={`flex items-center p-4 bg-white dark:bg-zinc-900 border rounded-xl transition-all ${
                  isUnread 
                    ? "bg-blue-50/50 dark:bg-zinc-800/80 border-blue-200 dark:border-blue-900/30" 
                    : "border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold mr-4 text-lg flex-shrink-0">
                  {conv.userDetails.Name.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`font-semibold truncate pr-2 ${
                      isUnread 
                        ? "text-zinc-900 dark:text-white" 
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}>
                      {conv.userDetails.Name}
                    </h3>
                    <span className={`text-xs whitespace-nowrap ${
                      isUnread ? "text-blue-600 font-bold" : "text-zinc-400"
                    }`}>
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${
                       isUnread 
                        ? "text-zinc-900 dark:text-white font-semibold" 
                        : "text-zinc-500"
                    }`}>
                      {conv.lastMessage.sender === conv._id ? "" : "You: "}
                      {conv.lastMessage.content}
                    </p>
                    {isUnread && (
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-600 ml-2 shadow-sm flex-shrink-0" />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
