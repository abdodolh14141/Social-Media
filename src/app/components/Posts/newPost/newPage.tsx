"use client";

import { useState } from "react";
import { getSession } from "next-auth/react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { CldUploadWidget } from "next-cloudinary";
import { useRouter } from "next/navigation";

interface NewPost {
  title: string;
  content: string;
  ImageId: string;
  imageUrl: string;
}

export default function NewPost() {
  const [newPostForm, setNewPostForm] = useState<NewPost>({
    title: "",
    content: "",
    ImageId: "",
    imageUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setNewPostForm((prevForm) => ({ ...prevForm, [id]: value }));
  };

  // Validate form inputs
  const validateForm = (): boolean => {
    const { title, content, ImageId } = newPostForm;
    if (!ImageId) return toast.error("Please upload an image."), false;
    if (!title) return toast.error("Please enter a title."), false;
    if (!content) return toast.error("Please enter the content."), false;
    return true;
  };

  // Handle form submission
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);

      const session = await getSession();
      if (!session?.user?.email) {
        toast.error("You must be logged in to create a post.");
        return;
      }

      // Submit post data
      const response = await axios.post("/api/posts/addNewPost", {
        title: newPostForm.title,
        content: newPostForm.content,
        ImageId: newPostForm.ImageId,
        authorEmail: session.user.email,
      });

      if (response.status === 201 || response.data.success) {
        toast.success("Post created successfully!");
        setNewPostForm({ title: "", content: "", ImageId: "", imageUrl: "" });
        router.push("/");
      } else {
        toast.error(response.data.message || "Failed to create the post.");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleUploadSuccess = (info: {
    public_id: string;
    secure_url: string;
  }) => {
    const { public_id, secure_url } = info;
    setNewPostForm((prevForm) => ({
      ...prevForm,
      ImageId: public_id,
      imageUrl: secure_url,
    }));
    toast.success("Image uploaded successfully!");
  };

  return (
    <>
      <div className="container mx-auto max-w-8xl p-5">
        <Toaster />

        <form
          onSubmit={handlePostSubmit}
          className="bg-white shadow-md rounded-lg p-6 mx-auto"
          aria-label="Create a New Post"
        >
          <h1 className="text-2xl text-center font-bold text-gray-800 mb-6">
            Create a New Post
          </h1>
          {/* Post Title */}
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-lg font-medium text-gray-700"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={newPostForm.title}
              onChange={handleChange}
              placeholder="Enter your post title"
              className="w-full p-2 mt-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <label
              htmlFor="content"
              className="block text-lg font-medium text-gray-700"
            >
              Content
            </label>
            <textarea
              id="content"
              value={newPostForm.content}
              onChange={handleChange}
              placeholder="Write your post content here..."
              className="w-full p-2 mt-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
            ></textarea>
          </div>

          {/* Image Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Upload Image
            </label>
            <div>
              <CldUploadWidget
                uploadPreset="hg1ghiyh"
                onSuccess={({ info }: any) => handleUploadSuccess(info)}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      open();
                    }}
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Upload Image
                  </button>
                )}
              </CldUploadWidget>
            </div>

            {newPostForm.imageUrl && (
              <div className="mt-4 ">
                <img
                  src={newPostForm.imageUrl}
                  alt="Uploaded preview"
                  className="max-w-xs rounded-md shadow-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    setNewPostForm({
                      ...newPostForm,
                      ImageId: "",
                      imageUrl: "",
                    })
                  }
                  className="mt-2 px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              !newPostForm.title ||
              !newPostForm.content ||
              !newPostForm.ImageId
            }
            className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Submitting..." : "Submit Post"}
          </button>
        </form>
      </div>{" "}
      <hr className="my-8 border-t-8 border-black rounded-md shadow-md w-full" />
    </>
  );
}
