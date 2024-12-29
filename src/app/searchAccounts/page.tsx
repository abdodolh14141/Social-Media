"use client";

import { getSession } from "next-auth/react";
import { toast, Toaster } from "sonner";
import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { FormEvent } from "react";

interface Account {
  _id: string;
  Name: string;
  Email: string;
}

export default function Account() {
  const [name, setName] = useState("");
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNameSearch = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!name.trim()) {
        toast.error("Please enter a username.");
        return;
      }

      setLoading(true);
      setSearchResults([]);
      setSelectedAccount(null);

      try {
        const { data, status } = await axios.post("/api/users/searchUsers", {
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
            ? error.response?.data?.message
            : "An unexpected error occurred.";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [name]
  );

  const fetchSession = useCallback(async () => {
    try {
      const session = await getSession();
      if (session?.user?.name) setName(session.user.name);
    } catch {
      toast.error("An error occurred while fetching the session.");
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const mappedAccounts = useMemo(
    () =>
      searchResults.map((account) => (
        <Link href={`/ProfileUser/${account._id}`} key={account._id} passHref>
          <li
            className={`p-4 border rounded-md cursor-pointer hover:bg-blue-50 transition-all duration-300 ${
              selectedAccount?._id === account._id ? "bg-blue-100" : ""
            }`}
            onClick={() => setSelectedAccount(account)}
          >
            <p className="flex justify-start items-center font-bold text-lg p-2 text-gray-800">
              <img
                src="https://img.icons8.com/color/48/test-account.png"
                alt="User Icon"
                className="mr-3"
              />
              {account.Name}
            </p>
          </li>
        </Link>
      )),
    [searchResults, selectedAccount]
  );

  return (
    <div className="max-w-5xl m-3 mx-auto p-6 bg-white rounded-xl shadow-lg hover:scale-125 transition duration-300">
      <Toaster />
      <form onSubmit={handleNameSearch} className="text-center w-full">
        <h2 className="mb-4 text-xl text-gray-600">
          Enter a username to search
        </h2>
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
            className="bg-blue-500 w-full text-white py-2 px-4 rounded-md max-w-md hover:bg-blue-600 transition duration-200 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <div className="loader border-t-transparent"></div>
            ) : (
              "Search for Account"
            )}
          </button>
        </div>
      </form>

      {searchResults.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-center mb-4 text-gray-700">
            Select an Account
          </h3>
          <ul className="space-y-4">{mappedAccounts}</ul>
        </div>
      )}
    </div>
  );
}
