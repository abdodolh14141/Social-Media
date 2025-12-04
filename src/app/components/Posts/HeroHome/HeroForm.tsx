"use client";

// Recommended hook for client-side session management
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

// Import components using aliases for clarity
import NewPostForm from "../newPost/newPage";
import PostFeed from "../fetchPosts/getPosts";
import AccountSearch from "../../../searchAccounts/page";
import AboutSection from "../../../about/page";

// Define the paths for better maintainability (optional)
const LOGIN_PATH = "/api/auth/signin";

export default function HeroForm() {
  // 1. Use useSession hook for state management
  const { data: session, status } = useSession();
  const router = useRouter();

  // Status can be 'loading', 'authenticated', or 'unauthenticated'
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  // Optional: Effect to redirect unauthenticated users if this page requires login
  // Currently, we just hide the NewPost form, so this isn't strictly necessary.
  // If you wanted to force a redirect:
  /*
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // You can redirect to the login page or a custom sign-in component
      router.push(LOGIN_PATH); 
    }
  }, [isAuthenticated, isLoading, router]);
  */

  // 2. Handle Loading State
  if (isLoading) {
    // Render a simple loading indicator while the session is being checked
    return (
      <div className="p-6 text-center text-gray-500">Loading session...</div>
    );
  }

  // 3. Render the Component
  return (
    <>
      {/* Replaced SearchAccount with a clearer name AccountSearch */}
      <div className="p-6">
        <AccountSearch />
      </div>

      <main className=" mx-auto p-2">
        {/* Only show the NewPostForm if the user is authenticated */}
        {isAuthenticated ? (
          <NewPostForm />
        ) : (
          // Better message or prompt when not authenticated, instead of an empty span
          <div className="text-center p-4 border border-dashed border-gray-300 rounded-lg mb-6">
            <p className="text-white">
              <span className="font-semibold">Sign in</span> to post content and
              interact with the community.
            </p>
            {/* Optional: Add a button to easily sign in or redirect */}
            <button
              onClick={() => router.push("/login")}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Go to Sign In
            </button>
          </div>
        )}

        <div className="mt-8">
          {/* Replaced GetPosts with a clearer name PostFeed */}
          <PostFeed />
        </div>

        <div className="mt-20">
          {/* Replaced About with a clearer name AboutSection */}
          <AboutSection />
        </div>
      </main>
    </>
  );
}
