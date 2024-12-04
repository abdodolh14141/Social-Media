"use client";

import axios from "axios";
import React, { useState } from "react";
import { toast, Toaster } from "sonner";

export default function Contact() {
  const [formReport, setReport] = useState({
    email: "",
    message: "",
  });
  const report = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { email, message } = formReport;
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
      toast.error(error);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Toaster />
      <div className="w-full max-w-6xl bg-white shadow-lg rounded-lg p-8">
        {/* Heading */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Get in Touch
        </h1>

        {/* Form */}
        <form onSubmit={report} className="space-y-8">
          {/* Email Input */}
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
              onChange={(e) =>
                setReport({ ...formReport, email: e.target.value })
              }
              required
              className="mt-2 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3"
            />
          </div>

          {/* Message Textarea */}
          <div>
            <label
              htmlFor="message"
              className="block text-base font-medium text-gray-700"
            >
              Message
            </label>
            <textarea
              id="message"
              onChange={(e) =>
                setReport({ ...formReport, message: e.target.value })
              }
              rows={6}
              placeholder="Write your message here..."
              required
              className="mt-2 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-3"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300"
            >
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}