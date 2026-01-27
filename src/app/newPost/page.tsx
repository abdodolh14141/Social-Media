"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { CldUploadWidget } from "next-cloudinary";
import LoginWithGoogle from "@/app/components/buttons/LoginWithGoogle";
import { useRouter } from "next/navigation";
import { useElysiaSession } from "@/app/libs/hooks/useElysiaSession";
import {
  ImagePlus,
  X,
  Send,
  Loader2,
  UserCircle,
  ChevronLeft,
  Sparkles,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NewPost() {
  const [newPostForm, setNewPostForm] = useState({
    title: "",
    content: "",
    ImageId: "",
    imageUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { data: session, status } = useElysiaSession();
  const router = useRouter();

  useEffect(() => setIsMounted(true), []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewPostForm((prev) => ({ ...prev, [name]: value }));
  };

  const removeImage = () =>
    setNewPostForm((prev) => ({ ...prev, ImageId: "", imageUrl: "" }));

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return toast.error("Please login first");

    try {
      setLoading(true);
      const response = await axios.post("/api/posts/actionPosts/addNewPost", {
        ...newPostForm,
        authorEmail: session.user?.email,
      });

      if (response.status === 201 || response.data.success) {
        toast.success("Your story is live!");
        router.push("/");
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to publish");
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-50 dark:bg-zinc-900/50 p-12 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 text-center shadow-xl"
        >
          <div className="bg-white dark:bg-zinc-800 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Sparkles className="text-indigo-500" size={32} />
          </div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-3">
            Writer's Room
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10 text-lg">
            Sign in to share your thoughts with the community.
          </p>
          <LoginWithGoogle />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/40">
      <Toaster richColors position="bottom-right" />

      {/* MINIMALIST HEADER BAR */}
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-screen-xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-3 border-l border-zinc-200 dark:border-zinc-800 pl-6">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  className="w-8 h-8 rounded-full grayscale hover:grayscale-0 transition-all"
                  alt="user"
                />
              ) : (
                <UserCircle size={24} className="text-zinc-400" />
              )}
              <span className="text-sm font-bold opacity-60 italic">
                {session?.user?.name} is writing...
              </span>
            </div>
          </div>

          <button
            onClick={handlePostSubmit}
            disabled={loading || !newPostForm.title || !newPostForm.content}
            className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white font-black px-8 py-3 rounded-2xl transition-all hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-20 disabled:grayscale active:scale-95"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Send size={18} /> <span>Publish Story</span>
              </>
            )}
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-16 px-6">
        <form onSubmit={handlePostSubmit} className="space-y-12">
          {/* IMAGE SLOT */}
          <section className="relative group">
            {!newPostForm.imageUrl ? (
              <CldUploadWidget
                uploadPreset="hg1ghiyh"
                onSuccess={(result: any) => {
                  setNewPostForm((p) => ({
                    ...p,
                    ImageId: result.info.public_id,
                    imageUrl: result.info.secure_url,
                  }));
                  toast.success("Cover image added");
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="w-full aspect-[21/9] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-zinc-400 hover:border-indigo-400 dark:hover:border-indigo-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all duration-500"
                  >
                    <div className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-sm">
                      <Plus size={28} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60">
                      Add Cover Image
                    </span>
                  </button>
                )}
              </CldUploadWidget>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <img
                  src={newPostForm.imageUrl}
                  className="w-full aspect-[21/9] rounded-[2.5rem] object-cover shadow-2xl"
                  alt="preview"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-6 right-6 bg-white/90 dark:bg-black/80 backdrop-blur-md p-3 rounded-full text-zinc-900 dark:text-white hover:bg-red-500 hover:text-white transition-all shadow-xl"
                >
                  <X size={20} />
                </button>
              </motion.div>
            )}
          </section>

          {/* WRITING AREA */}
          <div className="space-y-8">
            <textarea
              name="title"
              rows={1}
              value={newPostForm.title}
              onChange={(e) => {
                handleChange(e);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              placeholder="Post Title"
              className="w-full bg-transparent border-none outline-none text-5xl md:text-7xl font-black placeholder:text-zinc-100 dark:placeholder:text-zinc-900 tracking-tight resize-none"
            />

            <textarea
              name="content"
              value={newPostForm.content}
              onChange={handleChange}
              placeholder="Tell your story..."
              className="w-full bg-transparent border-none outline-none min-h-[500px] text-xl md:text-2xl text-zinc-700 dark:text-zinc-300 leading-relaxed placeholder:text-zinc-100 dark:placeholder:text-zinc-900 resize-none pb-32"
            />
          </div>

          {/* FLOATING STATUS UTILITY */}
          <div className="fixed bottom-12 right-12 z-40 hidden md:flex items-center gap-6 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-2xl">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Word Progress
              </span>
              <span className="text-sm font-bold text-indigo-500">
                {newPostForm.content.length} / 1000
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden relative">
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-indigo-500/20"
                initial={{ height: 0 }}
                animate={{
                  height: `${(newPostForm.content.length / 1000) * 100}%`,
                }}
              />
              <Sparkles
                size={20}
                className={
                  newPostForm.content.length > 500
                    ? "text-indigo-500 transition-colors"
                    : "text-zinc-300"
                }
              />
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
