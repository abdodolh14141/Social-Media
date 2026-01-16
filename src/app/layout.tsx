import Header from "./components/nav/Header";
import Footer from "./components/lastNav/headerLast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Metadata } from "next";
import "./globals.css";
import Providers from "@/context/Providers";

export const metadata: Metadata = {
  title: "Social Media App",
  description: "A social media application built with Next.js and React.",
  icons: {
    icon: "https://cdn-icons-png.flaticon.com/512/2065/2065157.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Validate environment variable
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is required");
  }

  return (
    <html lang="en">
      <body>
        <main>
          <div className="h-lvh mx-auto p-2 ">
            <GoogleOAuthProvider clientId={googleClientId}>
              <Providers>
                <Header />
                {children}
                <Footer />
              </Providers>
            </GoogleOAuthProvider>
          </div>
        </main>
      </body>
    </html>
  );
}
