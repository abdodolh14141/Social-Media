"use client";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { getSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CldImage } from "next-cloudinary";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  gender: string;
  follow: number;
  age: number | null;
  profileImage?: string;
}

interface Comment {
  idPost: string;
  CommentUserId: string;
  TextComment: string;
}

export default function ProfileUser() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwnAccount, setIsOwnAccount] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  const { id: userId } = useParams();
  const router = useRouter();

  // Fetch Profile Data
  const fetchProfileData = useCallback(async () => {
    try {
      const { data } = await axios.post("/api/users/searchProfile", {
        id: userId,
      });
      const user = data?.user;

      if (user) {
        setProfileData({
          id: user._id,
          name: user.Name,
          email: user.Email,
          gender: user.Gender || "Unknown",
          follow: user.Follow || 0,
          age: user.Age || null,
          profileImage: user.profileImage || "",
        });
        setIsFollowing(user.isUserFollowing);
      } else {
        toast.error("Could not find the account.");
      }
    } catch (error) {
      toast.error("Failed to load profile.");
    }
  }, [userId]);

  // Fetch Posts and Comments
  const fetchPostsAndComments = useCallback(async () => {
    try {
      const [postRes, commentRes] = await Promise.all([
        axios.post("/api/posts/getPostsUser", { IdUser: userId }),
        axios.get("/api/posts/fetchComments"),
      ]);

      if (postRes.status !== 200 || commentRes.status !== 200) {
        toast.error(
          "Failed to load posts and comments. Please try again later."
        );
        return;
      }

      setPosts(postRes.data.posts || []);
      setComments(commentRes.data.comments || []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load posts and comments. Error: " + error);
    }
  }, [userId]);

  // Handle Follow/Unfollow
  const handleFollow = useCallback(async () => {
    if (loading || !profileData) return;

    setLoading(true);
    try {
      const session = await getSession();
      const emailUser = session?.user?.email;

      if (!emailUser) {
        toast.error("You must be logged in to follow.");
        return;
      }

      const { data } = await axios.post("/api/users/AddFollow", {
        FollowByEmail: emailUser,
        AccountId: profileData.id,
      });

      if (data?.success) {
        const action = data.action;
        setProfileData((prev) =>
          prev
            ? { ...prev, follow: prev.follow + (action === "follow" ? 1 : -1) }
            : null
        );
        setIsFollowing(action === "follow");
        toast.success(
          action === "follow"
            ? "You followed this profile!"
            : "You unfollowed this profile."
        );
      } else {
        toast.error(data.message || "Failed to update follow state.");
      }
    } catch {
      toast.error("An error occurred while following.");
    } finally {
      setLoading(false);
    }
  }, [loading, profileData]);

  // Handle Post Deletion
  const handleDelete = async (postId: string) => {
    try {
      const res = await axios.put(`/api/posts/deletePost`, { postId });
      if (res.status === 200) {
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post._id !== postId)
        );
        toast.success("Post deleted successfully.");
      } else {
        toast.error("Failed to delete post.");
      }
    } catch {
      toast.error("An error occurred while deleting the post.");
    }
  };

  // Check if Profile Belongs to Logged-in User
  useEffect(() => {
    const checkOwnAccount = async () => {
      try {
        const session = await getSession();
        setIsOwnAccount(session?.user?.email === profileData?.email);
      } catch {
        toast.error("Failed to verify ownership.");
      }
    };

    checkOwnAccount();
  }, [profileData]);

  // Initial Data Fetch
  useEffect(() => {
    if (userId) {
      fetchProfileData();
      fetchPostsAndComments();
    }
  }, [userId, fetchProfileData, fetchPostsAndComments]);

  const commentsByPostId = comments.reduce((acc, comment) => {
    if (!acc[comment.idPost]) acc[comment.idPost] = [];
    acc[comment.idPost].push(comment);
    return acc;
  }, {} as Record<string, Comment[]>);

  return (
    <>
      <Toaster />
      <div className="flex flex-col items-center bg-white shadow-lg rounded-lg p-10 my-40 max-w-7xl mx-auto">
        {isOwnAccount ? (
          <h4 className="text-xl font-bold m-2 p-2">Welcome Your Profile</h4>
        ) : (
          <h4>Account</h4>
        )}
        <img
          src={
            profileData?.profileImage ||
            "https://cdn-icons-png.flaticon.com/512/8345/8345328.png"
          }
          alt="Profile avatar"
          className="w-40 h-40 rounded-full shadow-md object-cover"
        />
        <div className="text-center mt-6">
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">
            {profileData?.name || "Guest"}
          </h1>
          <h2 className="text-2xl p-2 text-gray-600">
            {profileData?.email || "Not provided"}
          </h2>
          <ul>
            <li>Age: {profileData?.age || "Unknown"}</li>
            <li>Gender: {profileData?.gender}</li>
          </ul>
        </div>
        <div className="mt-4 flex flex-col items-center">
          <p className="text-xl text-gray-600">
            Followers:{" "}
            <span className="font-bold text-gray-800">
              {profileData?.follow}
            </span>
          </p>
          {isOwnAccount ? (
            <p className="text-lg font-bold p-2">You cannot follow yourself</p>
          ) : (
            <button
              className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md shadow-lg transition-all duration-200 disabled:opacity-50"
              onClick={handleFollow}
              disabled={loading}
            >
              {loading ? "Processing..." : isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>
        <hr className="my-6 bg-black" />
        <div className="postsUser">
          <h1 className="text-center text-3xl font-semibold p-2 m-2">Posts</h1>
          {posts.length === 0 ? (
            <p className="text-gray-600 text-center">
              No posts found for this user.
            </p>
          ) : (
            posts.map((post) => (
              <div key={post._id}>
                {isOwnAccount ? (
                  <div className="flex justify-end space-x-4 p-2">
                    <Link
                      href={`/api/EditPost/${post._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(post._id)}
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600 mb-2">
                    <em>
                      Created By{" "}
                      <Link
                        href={`/ProfileUser/${post.IdUserCreated}`}
                        className="text-blue-600 hover:underline"
                      >
                        {post.AuthorName}
                      </Link>
                    </em>
                  </p>
                )}
                <div className="p-6 border rounded-lg m-4 shadow-sm bg-gray-100">
                  <h3 className="text-3xl font-bold text-center text-gray-800 mb-2">
                    {post.Title}
                  </h3>

                  {post.PublicImage && (
                    <div className="my-4">
                      <CldImage
                        src={post.PublicImage}
                        alt="Post Image"
                        width="650"
                        height="300"
                        className="rounded-xl shadow-md max-w-full mx-auto"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}

                  <p className="text-2xl text-gray-700 text-center">
                    {post.Content}
                  </p>

                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-700 text-center text-3xl p-4">
                      Comments:
                    </h4>
                    {commentsByPostId[post._id]?.length ? (
                      <div className="space-y-4">
                        {commentsByPostId[post._id].map((comment, idx) => (
                          <div
                            key={idx}
                            className="flex items-start bg-gray-800 text-white rounded-lg shadow-md p-4"
                          >
                            <Link
                              href={`/ProfileUser/${
                                comment.CommentUserId.split("_")[0]
                              }`}
                              className="hover:scale-125"
                            >
                              <img
                                src="https://img.icons8.com/color/48/test-account.png"
                                alt="User Icon"
                                className="p-1 rounded-lg"
                              />
                            </Link>
                            <p className="text-lg m-5 text-white font-bold">
                              {comment.TextComment}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center">
                        No comments yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
