"use client";

import { useState } from "react";
import { getSession } from "next-auth/react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { CldUploadButton } from "next-cloudinary";

interface NewPost {
  title: string;
  content: string;
  ImageId: string;
}

export default function NewPost() {
  const [newPostForm, setNewPostForm] = useState<NewPost>({
    title: "",
    content: "",
    ImageId: "",
  });
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setNewPostForm((prevForm) => ({ ...prevForm, [id]: value }));
  };

  // Handle form submission
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { title, content, ImageId } = newPostForm;

    // Validate inputs
    if (!title || !content || !ImageId) {
      toast.error("All fields are required, including an image.");
      return;
    }

    try {
      setLoading(true);

      const session = await getSession();
      if (!session?.user?.email) {
        toast.error("You must be logged in to create a post.");
        return;
      }

      // Submit post data
      const response = await axios.post("/api/posts/addNewPost", {
        title,
        content,
        ImageId,
        authorEmail: session.user.email,
      });

      if (response.status === 201 || response.data.success) {
        toast.success("Post created successfully!");
        setNewPostForm({ title: "", content: "", ImageId: "" });
      } else {
        toast.error(response.data.message || "Failed to create the post.");
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(
        error.response?.data?.message || "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleUpload = (result: any) => {
    if (result.event === "success") {
      setNewPostForm((prevForm) => ({
        ...prevForm,
        ImageId: result.info.secure_url,
      }));
      toast.success("Image uploaded successfully!");
    } else {
      toast.error("Image upload failed. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster />
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Create a New Post
      </h1>
      <form
        onSubmit={handlePostSubmit}
        className="bg-white shadow-md rounded-lg p-6"
        aria-label="Create a New Post"
      >
        {/* Post Title */}
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
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
            required
          />
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700"
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
            required
          ></textarea>
        </div>

        {/* Image Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Upload Image
          </label>
          <CldUploadButton
            uploadPreset="hg1ghiyh"
            onUpload={handleUpload}
            className="mt-2 text-blue-600 underline cursor-pointer"
          >
            Upload Image
          </CldUploadButton>
          {newPostForm.ImageId && (
            <div className="mt-4">
              <img
                src={newPostForm.ImageId}
                alt="Uploaded preview"
                className="max-w-xs rounded-md shadow-sm"
              />
              <p className="text-sm text-green-600 mt-2">
                Image uploaded successfully!
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
            loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Submitting..." : "Submit Post"}
        </button>
      </form>
    </div>
  );
}
