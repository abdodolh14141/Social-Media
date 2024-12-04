"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import { getSession } from "next-auth/react";
import { toast, Toaster } from "sonner";
import axios from "axios";
import Link from "next/link";

interface Account {
  id: string;
  name: string;
  email: string;
}

export default function Account() {
  const [name, setName] = useState("");
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNameSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a username.");
      return;
    }

    setLoading(true);
    setSearchResults([]);
    setSelectedAccount(null);

    try {
      const { data, status } = await axios.post("/api/users/searchUser", {
        name,
      });
      if (status === 200 && data.user.length > 0) {
        setSearchResults(data.user);
        toast.success("Accounts found successfully.");
      } else {
        toast.error("No accounts found.");
      }
    } catch (error) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "An unexpected error occurred.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSession();
        if (session?.user?.name) setName(session.user.name);
      } catch {
        toast.error("An error occurred while fetching the session.");
      }
    };
    fetchSession();
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg animate-fadeIn">
      <Toaster />
      <form onSubmit={handleNameSearch} className="text-center">
        <h1 className="text-4xl font-bold mb-4">Search for Accounts</h1>
        <p className="mb-6 text-gray-600">
          Enter a username to search for accounts
        </p>
        <div className="flex flex-col items-center">
          <input
            type="text"
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-md p-2 mb-4 w-full max-w-md text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded-md w-full max-w-md hover:bg-blue-600 transition duration-200"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search for Account"}
          </button>
        </div>
      </form>

      {searchResults.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-center mb-4">
            Select an Account
          </h2>
          <ul className="max-w-lg mx-auto space-y-4">
            {searchResults.map((account) => (
              <Link
                href={`/ProfileUser/${account._id}`}
                key={account.id}
                passHref
              >
                <li
                  className={`p-4 border rounded-md cursor-pointer hover:bg-blue-50 ${
                    selectedAccount?.id === account.id ? "bg-blue-100" : ""
                  }`}
                  onClick={() => setSelectedAccount(account)}
                >
                  <p className="font-bold text-lg">Name: {account.Name}</p>
                  <p className="text-gray-700">Email: {account.Email}</p>
                </li>
              </Link>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
