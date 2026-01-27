"use client";

import { useState, useEffect } from "react";
import { useElysiaSession } from "@/app/libs/hooks/useElysiaSession";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { CldUploadWidget } from "next-cloudinary";
import { useRouter } from "next/navigation";
import LoginWithGoogle from "@/app/components/buttons/LoginWithGoogle";
import { motion } from "framer-motion";
import { ImagePlus, Send, Loader2, X, Sparkles } from "lucide-react";

interface NewPost {
  title: string;
  content: string;
  ImageId: string;
  imageUrl: string;
}

const initialFormState: NewPost = {
  title: "",
  content: "",
  ImageId: "",
  imageUrl: "",
};

export default function NewPost() {
  const [newPostForm, setNewPostForm] = useState<NewPost>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { data: session, status } = useElysiaSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewPostForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadSuccess = (result: any) => {
    if (result?.event === "success") {
      setNewPostForm((prev) => ({
        ...prev,
        ImageId: result.info.public_id,
        imageUrl: result.info.secure_url,
      }));
      toast.success("Image ready!");
    }
  };

  const removeImage = () => {
    setNewPostForm((prev) => ({ ...prev, ImageId: "", imageUrl: "" }));
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) return toast.error("Please log in first.");

    if (
      !newPostForm.title.trim() ||
      !newPostForm.content.trim() ||
      !newPostForm.ImageId
    ) {
      toast.error("Complete all fields and add an image.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/posts/actionPosts/addNewPost", {
        ...newPostForm,
        authorEmail: session.user.email,
      });

      if (response.data.success || response.status === 201) {
        toast.success("Post is now live!");

        // 1. Clear the inputs
        setNewPostForm(initialFormState);

        // 2. Refresh server data and redirect
        router.refresh();
        router.push("/");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || !isMounted) return null;

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full p-8 text-center bg-white border border-gray-100 shadow-2xl rounded-3xl"
        >
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Join the Community
          </h2>
          <p className="text-gray-500 mb-8">
            Sign in to share your stories with the world.
          </p>
          <LoginWithGoogle />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-5 m-2 bg-white rounded-lg">
      <Toaster richColors position="top-center" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <header className="m-2 text-center">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            New Story
          </h1>
          <p className="text-gray-500 mt-2">
            Drafting as {session?.user?.name}
          </p>
        </header>

        <form onSubmit={handlePostSubmit} className="space-y-8">
          <div className="relative group">
            <CldUploadWidget
              uploadPreset="hg1ghiyh"
              onSuccess={handleUploadSuccess}
            >
              {({ open }) => (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => open()}
                    className={`w-full overflow-hidden rounded-3xl transition-all duration-300 border-2 border-dashed ${
                      newPostForm.imageUrl
                        ? "border-transparent"
                        : "border-gray-200 bg-gray-50 h-64 hover:bg-gray-100 hover:border-blue-400"
                    }`}
                  >
                    {newPostForm.imageUrl ? (
                      <div className="relative group">
                        <img
                          src={newPostForm.imageUrl}
                          className="w-full h-[400px] object-cover rounded-3xl"
                          alt="Cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <p className="text-white font-bold flex items-center gap-2">
                            <ImagePlus size={20} /> Change Cover Image
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <ImagePlus size={40} strokeWidth={1.5} />
                        <span className="font-semibold text-lg">
                          Add a cover photo
                        </span>
                      </div>
                    )}
                  </button>
                  {newPostForm.imageUrl && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-4 right-4 z-10 bg-white/90 p-2 rounded-full text-red-500 shadow-md hover:bg-red-50 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              )}
            </CldUploadWidget>
          </div>

          <div className="space-y-6">
            <input
              name="title"
              value={newPostForm.title}
              onChange={handleChange}
              placeholder="Give your story a title..."
              className="w-full bg-transparent text-4xl md:text-5xl font-extrabold text-gray-900 placeholder:text-gray-200 outline-none border-none"
              maxLength={100}
              required
            />

            <div className="relative">
              <textarea
                name="content"
                value={newPostForm.content}
                onChange={handleChange}
                placeholder="What's on your mind?"
                className="w-full bg-transparent text-xl text-gray-700 placeholder:text-gray-300 outline-none min-h-[300px] resize-none leading-relaxed"
                maxLength={1000}
                required
              />
              <div className="flex justify-end gap-4 text-xs font-medium text-gray-400 mt-4 border-t pt-4">
                <span>{newPostForm.title.length}/100 Title</span>
                <span>{newPostForm.content.length}/1000 Content</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-6">
            <button
              type="submit"
              disabled={loading}
              className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-200 active:scale-95"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  Publish Story
                  <Send
                    size={20}
                    className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                  />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
