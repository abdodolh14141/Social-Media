"use client";

import { getSession } from "next-auth/react";
import { toast, Toaster } from "sonner";
import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import debounce from "lodash.debounce";

interface Account {
  _id: string;
  Name: string;
  Email: string;
}

export default function Account() {
  const [name, setName] = useState("");
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);

      try {
        const { data, status } = await axios.post("/api/users/searchUsers", {
          name: searchTerm.trim(),
        });

        if (status === 200 && data.user?.length > 0) {
          setSearchResults(data.user);
        } else {
          setSearchResults([]);
          toast.error("No accounts found.");
        }
      } catch (error: any) {
        toast.error("An error occurred during the search.");
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  // Trigger search manually
  const handleSearch = async () => {
    debouncedSearch.cancel(); // Cancel any ongoing debounce to avoid conflicts
    await debouncedSearch(name);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    debouncedSearch(value);
  };

  // Fetch session on component mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSession();
        if (session?.user?.name) setName(session.user.name);
      } catch {
        toast.error("An error occurred while fetching session data.");
      }
    };

    fetchSession();

    // Cleanup debounce on unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Render search results
  const mappedAccounts = useMemo(
    () =>
      searchResults.map((account) => (
        <Link href={`/ProfileUser/${account._id}`} key={account._id} passHref>
          <li className="p-4 border rounded-md cursor-pointer hover:bg-blue-50 transition-all duration-300">
            <p className="flex items-center font-bold text-lg text-gray-800">
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
    [searchResults]
  );

  return (
    <>
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-lg">
        <Toaster />
        <form
          onSubmit={(e) => e.preventDefault()}
          className="text-center w-full"
        >
          <h2 className="mb-4 text-2xl text-gray-600">Search for a Accounts</h2>
          <div className="flex flex-col items-center">
            <input
              type="text"
              placeholder="Enter username"
              onChange={handleInputChange}
              className="border rounded-md p-2 mb-4 w-full max-w-7xl text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="bg-blue-500 text-white py-2 px-4 rounded-md w-full max-w-7xl hover:bg-blue-600 transition duration-200 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span className="loader border-t-transparent" />
              ) : (
                "Search"
              )}
            </button>
          </div>
        </form>

        {loading && (
          <p className="text-blue-500 mt-2 text-center">Searching...</p>
        )}

        {searchResults.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl font-semibold text-center mb-4 text-gray-700">
              Select an Account
            </h3>
            <ul className="space-y-4">{mappedAccounts}</ul>
          </div>
        )}
      </div>{" "}
      <hr className="my-8 border-t-8 border-black rounded-md shadow-md w-full" />
    </>
  );
}
