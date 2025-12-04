import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Fix: Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

    if (!title.trim()) {
      toast.error("Please enter a title.");
      return false;
    }
    if (!content.trim()) {
      toast.error("Please enter the content.");
      return false;
    }
    if (!ImageId) {
      toast.error("Please upload an image.");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Fix: Check authentication before submission
    if (status === "unauthenticated" || !session?.user?.email) {
      toast.error("You must be logged in to create a post.");
      return;
    }

    try {
      setLoading(true);

      // Submit post data
      const response = await axios.post("/api/posts/addNewPost", {
        title: newPostForm.title.trim(),
        content: newPostForm.content.trim(),
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
      console.error("Error creating post:", error);
      toast.error(
        error.response?.data?.message || "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleUploadSuccess = (result: any) => {
    if (result?.event === "success") {
      const { public_id, secure_url } = result.info;
      setNewPostForm((prevForm) => ({
        ...prevForm,
        ImageId: public_id,
        imageUrl: secure_url,
      }));
      toast.success("Image uploaded successfully!");
    }
  };

  const handleUploadError = () => {
    toast.error("Image upload failed. Please try again.");
  };

  const handleRemoveImage = () => {
    setNewPostForm((prev) => ({
      ...prev,
      ImageId: "",
      imageUrl: "",
    }));
    toast.info("Image removed");
  };

  // Show loading state while checking authentication
  if (status === "loading" || !isMounted) {
    return (
      <div className="container mx-auto max-w-4xl p-5">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  // Show message if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto max-w-4xl p-5">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-yellow-700">
            You need to be logged in to create a post.
          </p>
        </div>
      </div>
    );
  }

  const isFormValid =
    newPostForm.title.trim() &&
    newPostForm.content.trim() &&
    newPostForm.ImageId;

  return (
    <div className="container mx-auto p-2 max-w-3xl">
      <Toaster richColors position="top-right" />

      <form
        onSubmit={handlePostSubmit}
        className="bg-white shadow-lg rounded-xl p-6 mx-auto border border-gray-100"
        aria-label="Create a New Post"
      >
        <h1 className="text-3xl text-center font-bold text-gray-900 mb-8">
          Create a New Post
        </h1>

        {/* Post Title */}
        <div className="mb-6">
          <label
            htmlFor="title"
            className="block text-lg font-semibold text-gray-800 mb-2"
          >
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={newPostForm.title}
            onChange={handleChange}
            placeholder="Enter your post title"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            maxLength={100}
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {newPostForm.title.length}/100
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-6">
          <label
            htmlFor="content"
            className="block text-lg font-semibold text-gray-800 mb-2"
          >
            Content *
          </label>
          <textarea
            id="content"
            value={newPostForm.content}
            onChange={handleChange}
            placeholder="Write your post content here..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-vertical"
            rows={6}
            maxLength={1000}
          ></textarea>
          <div className="text-right text-sm text-gray-500 mt-1">
            {newPostForm.content.length}/1000
          </div>
        </div>

        {/* Image Upload */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-gray-800 mb-2">
            Upload Image *
          </label>
          <div className="space-y-4">
            <CldUploadWidget
              uploadPreset="hg1ghiyh"
              onSuccess={handleUploadSuccess}
              onError={handleUploadError}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-md"
                >
                  Upload Image
                </button>
              )}
            </CldUploadWidget>

            {newPostForm.imageUrl && (
              <div className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50">
                <p className="text-green-700 font-medium mb-3">
                  Image uploaded successfully!
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <img
                    src={newPostForm.imageUrl}
                    alt="Uploaded preview"
                    className="max-w-xs rounded-lg shadow-sm border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isFormValid}
          className={`w-full py-3 px-4 rounded-lg text-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
            loading || !isFormValid
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-500 shadow-lg"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Creating Post...
            </span>
          ) : (
            "Publish Post"
          )}
        </button>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Fields marked with * are required</p>
        </div>
      </form>
    </div>
  );
}
