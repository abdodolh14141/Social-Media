"use client";

import axios from "axios";
import { useParams } from "next/navigation";
import { toast, Toaster } from "sonner";
import { useElysiaSession } from "@/app/libs/hooks/useElysiaSession";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { MessageSquare, UserPlus, UserMinus, ShieldCheck } from "lucide-react";
import icon from "../../../../public/iconAccount.png";
import FetchPostUser from "@/app/components/Posts/fetchPostsUser/fetchPostUser";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  gender: string;
  follow: number;
  age: number | null;
  Like: number;
  profileImage?: string;
  Followers: string[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
  hover: { scale: 1.02 },
};

export default function ProfileUser() {
  const { data: session } = useElysiaSession(); // Correct way to use session
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const params = useParams();
  const userId = params.id;

  // Determine ownership based on session data
  const isOwnAccount = session?.user?.email === profileData?.email;
  const isLogin = !!session?.user;

  const fetchProfileData = useCallback(async () => {
    if (!userId) return toast.error("Account not found");
    setLoadingProfile(true);
    try {
      const { data } = await axios.post("/api/users/searchProfile", { id: userId });
      const user = data?.user;

      if (user) {
        setProfileData({
          id: user._id,
          name: user.Name,
          email: user.Email,
          gender: user.Gender || "Unknown",
          follow: user.Follow || 0,
          age: user.Age || null,
          Like: user.Likes || 0,
          profileImage: user.UrlImageProfile || "",
          Followers: user.Followers || [],
        });
        setIsFollowing(!!user.isUserFollowing);
      } else {
        toast.error("Account not found.");
      }
    } catch (error) {
      toast.error("Failed to load profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  const handleFollow = async () => {
    if (loadingAction || !profileData || !isLogin) {
      if (!isLogin) toast.error("Please login to follow");
      return;
    }

    setLoadingAction(true);
    try {
      const res = await axios.post("/api/users/AddFollow", {
        FollowByEmail: session.user?.email,
        AccountId: profileData.id,
      });

      if (res.status === 200) {
        const action = res.data.action;
        setProfileData((prev) =>
          prev ? { ...prev, follow: prev.follow + (action === "follow" ? 1 : -1) } : null
        );
        setIsFollowing(action === "follow");
        toast.success(action === "follow" ? "Followed!" : "Unfollowed");
      }
    } catch {
      toast.error("Follow action failed.");
    } finally {
      setLoadingAction(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  if (loadingProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Toaster position="bottom-right" />
      
      {!profileData ? (
        <div className="text-center text-red-500">Profile not found.</div>
      ) : (
        <div className="space-y-8">
          {/* Profile Card */}
          <section className="overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <div className="px-8 pb-8">
              <div className="relative -mt-16 mb-6 flex items-end justify-between">
                <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-4 border-white bg-zinc-200 dark:border-zinc-900 shadow-lg">
                  <Image
                    src={profileData.profileImage || icon}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Actions */}
                <div className="flex gap-3">
                  {!isOwnAccount ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleFollow}
                        disabled={loadingAction}
                        className={`flex items-center gap-2 rounded-xl px-6 py-2.5 font-bold transition-all ${
                          isFollowing 
                          ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" 
                          : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isFollowing ? <UserMinus size={18} /> : <UserPlus size={18} />}
                        {isFollowing ? "Unfollow" : "Follow"}
                      </motion.button>

                      {isLogin && (
                        <Link href={`/messages/${profileData.id}`}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 font-bold text-white dark:bg-white dark:text-black"
                          >
                            <MessageSquare size={18} />
                            Message
                          </motion.button>
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-blue-600 dark:bg-blue-500/10">
                      <ShieldCheck size={18} />
                      <span className="text-sm font-bold">Your Official Profile</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{profileData.name}</h1>
                <p className="text-zinc-500">{profileData.email}</p>
              </div>

              <div className="mt-6 flex gap-8 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                <div className="text-center">
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{profileData.follow}</p>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{profileData.age || '—'}</p>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Age</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-zinc-900 dark:text-white">{profileData.gender}</p>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Gender</p>
                </div>
              </div>
            </div>
          </section>

          {/* Posts Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white px-2">Recent Posts</h3>
            <FetchPostUser userId={profileData.id} />
          </div>
        </div>
      )}
    </div>
  );
}