"use client";

import axios from "axios";
import React, { useCallback, useState } from "react";
import { toast, Toaster } from "sonner";

export default function Contact() {
  const [formReport, setReport] = useState({
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const report = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const { email, message } = formReport;
        setLoading(true);
        const res = await axios.post("/api/users/report", {
          email,
          message,
        });
        if (res.status === 200) {
          toast.success("Success Send Message");
          setReport({ email: "", message: "" });
        } else {
          toast.error("Failed Submit Report");
        }
      } catch (error: any) {
        toast.error(
          "An error occurred while sending the message. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    },
    [formReport]
  );

  return (
    <div className="flex items-center justify-center py-5 rounded-lg px-4 sm:px-6 lg:px-8 bg-opacity-75 bg-gray-100 shadow-xl transition duration-500 ease-in-out hover:bg-gray-200">
      <Toaster />
      <div className="w-full max-w-6xl rounded-lg p-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Get in Touch
        </h1>

        <form onSubmit={report} className="space-y-8">
          <div>
            <label
              htmlFor="email"
              className="block text-base font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter Your Email"
              value={formReport.email}
              onChange={(e) => {
                const email = e.target.value;
                setReport({ ...formReport, email });
              }}
              required
              className="mt-2 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-base font-medium text-gray-700"
            >
              Message
            </label>
            <textarea
              id="message"
              value={formReport.message}
              onChange={(e) =>
                setReport({ ...formReport, message: e.target.value })
              }
              rows={6}
              placeholder="Write your message here..."
              required
              className="mt-2 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3"
            ></textarea>
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
