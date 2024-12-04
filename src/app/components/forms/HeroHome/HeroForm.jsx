"use client";

import { getSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { Toaster, toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { CldImage } from "next-cloudinary";
import NewPost from "../newPost/newPage";

export default function HeroForm() {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch posts and check authentication on load
  useEffect(() => {
    const initializeData = async () => {
      try {
        const session = await getSession();
        setIsAuthenticated(!!session?.user);

        const { data } = await axios.get("/api/posts/fetchPosts");
        setPosts(data.posts || []);

        if (!session?.user) {
          toast("Please log in or create an account.");
        }
      } catch (error) {
        toast.error("Failed to load posts. Please refresh the page.");
      }
    };

    initializeData();
  }, [router]);

  // Format posts with defaults
  const formattedPosts = useMemo(() => {
    return posts.map((post) => ({
      ...post,
      AuthorName: post.AuthorName || "Anonymous",
      Like: post.Like || 0,
      Comments: post.Comments || [],
    }));
  }, [posts]);

  // Handle like action
  const handleAddLike = async (postId) => {
    try {
      setLoading(true);
      const session = await getSession();
      if (!session) {
        toast.error("You must be logged in to like a post.");
        return;
      }

      const { data } = await axios.post("/api/posts/addLike", {
        postId,
        userEmail: session.user.email,
      });

      if (data.success) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId ? { ...post, Like: post.Like + 1 } : post
          )
        );
        toast.success("You liked the post!");
      } else {
        toast.error(data.message || "Failed to like the post.");
      }
    } catch (error) {
      toast.error("Error liking the post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle comment action
  const handleAddComment = async (postId) => {
    const comment = comments[postId]?.trim();
    if (!comment) {
      toast.error("Comment cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      const session = await getSession();
      if (!session) {
        toast.error("You must be logged in to comment.");
        return;
      }

      const { data } = await axios.post("/api/posts/addComment", {
        postId,
        comment,
        userEmail: session.user.email,
      });

      if (data.success) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId
              ? { ...post, Comments: [...post.Comments, data.comment] }
              : post
          )
        );
        setComments((prev) => ({ ...prev, [postId]: "" }));
        toast.success("Comment added successfully!");
      } else {
        toast.error(data.message || "Failed to add comment.");
      }
    } catch (error) {
      toast.error("Error adding comment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      <header className="shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold text-white">SocialApp</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {isAuthenticated ? (
          <NewPost />
        ) : (
          <div className="text-center my-4">
            <h2 className="text-xl font-semibold text-white ">
              Login to create a post
            </h2>
          </div>
        )}

        {formattedPosts.map((post) => (
          <div key={post._id} className="p-6 border rounded-lg m-4 bg-white">
            <h3 className="text-lg font-bold text-gray-800">{post.Title}</h3>
            {post.PublicImage && (
              <CldImage
                src={post.PublicImage}
                alt="Post Image"
                width="600"
                height="400"
                className="mb-4 rounded-md"
              />
            )}
            <p className="text-gray-600">{post.Content}</p>
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => handleAddLike(post._id)}
                className="bg-green-500 text-white px-4 py-1 rounded-md font-semibold hover:bg-green-600"
                disabled={loading}
              >
                Like: {post.Like}
              </button>
              <div className="flex items-center">
                <input
                  type="text"
                  value={comments[post._id] || ""}
                  onChange={(e) =>
                    setComments((prev) => ({
                      ...prev,
                      [post._id]: e.target.value,
                    }))
                  }
                  placeholder="Write a comment"
                  className="border rounded-md px-2 py-1 mr-2"
                />
                <button
                  onClick={() => handleAddComment(post._id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded-md font-semibold hover:bg-blue-600"
                  disabled={loading}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
