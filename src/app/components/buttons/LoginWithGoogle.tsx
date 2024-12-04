"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons"; // Correct package import
import { signIn } from "next-auth/react";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginWithGoogle() {
  const router = useRouter();

  const handleLoginGmail = async () => {
    try {
      const res = await signIn("google");

      if (res?.ok) {
        toast.success("Successfully logged in with Google!");
        router.push("/");
      }
    } catch (error) {
      toast.error("Failed to login with Google. Please try again.");
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <button
        onClick={handleLoginGmail}
        className="bg-white text-black text-center w-full py-4 m-2 flex justify-center gap-2 items-center rounded shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Sign in with Google"
      >
        <FontAwesomeIcon icon={faGoogle} className="h-6" />
        <span>Sign In With Google</span>
      </button>
    </>
  );
}
