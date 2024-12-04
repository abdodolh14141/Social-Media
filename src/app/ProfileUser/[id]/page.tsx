"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { useSession } from "next-auth/react";

export default function ProfileUser() {
  const [formData, setData] = useState({
    id: "",
    name: "",
    email: "",
    gender: "",
    Follow: 0,
    age: null,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { id: NameUser } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleFollow = async () => {
    setLoading(true);
    try {
      const { id: idUser }: any = session?.user;
      const res = await axios.post("/api/users/AddFollow", {
        FollowById: idUser,
        AccountId: formData.id,
      });
      if (res.status === 200 && res.data.success) {
        setIsFollowing(true);
        toast.success("Successfully followed!");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error("Failed to follow the user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.post("/api/users/searchProfile", {
          id: NameUser,
        });
        if (response.status === 200) {
          const { _id, Name, Email, Gender, Follow, Age, isUserFollowing } =
            response.data.user;
          setData({
            id: _id,
            name: Name,
            email: Email,
            gender: Gender,
            Follow: Follow || 0,
            age: Age,
          });
          setIsFollowing(isUserFollowing); // Set isFollowing based on API response
        } else {
          toast.error("Could not find account");
        }
      } catch (error) {
        toast.error("An error occurred while fetching the profile");
      }
    };
    fetchProfileData();
  }, [NameUser]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") return <p>Loading...</p>;

  return (
    <>
      <Toaster />
      <div className="flex flex-col items-center bg-white shadow-lg rounded-lg p-8 my-12 max-w-6xl mx-auto">
        <img
          src="https://cdn-icons-png.flaticon.com/512/8345/8345328.png"
          alt="Profile"
          className="w-40 h-40 rounded-full shadow-md object-cover"
        />
        <div className="text-center mt-6">
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">
            {formData.name || "Guest"}
          </h1>
          <h2 className="text-2xl p-2 text-gray-600">
            {formData.email || "Not provided"}
          </h2>
          <ul>
            <li>Age: {formData.age}</li>
            <li>Gender: {formData.gender}</li>
          </ul>
          <p className="text-lg text-gray-700">
            My name is {formData.name}, I am {formData.age} years old and I am{" "}
            {formData.gender}.
          </p>
        </div>
        <div className="mt-4 flex flex-col items-center">
          <p className="text-xl text-gray-600">
            Followers:{" "}
            <span className="font-bold text-gray-800">{formData.Follow}</span>
          </p>
          <button
            className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md shadow-lg transition-all duration-200 disabled:opacity-50"
            onClick={handleFollow}
            disabled={isFollowing || loading}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>
      </div>
    </>
  );
}
