"use client";

import { useState, FormEvent } from "react";
import LoginWithGoogle from "../components/buttons/LoginWithGoogle";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";

// Define the type for form data
interface FormData {
  email: string;
  username: string;
  age: string; // Use string for compatibility with input value
  password: string;
  gender: string;
}

export default function Register() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    username: "",
    age: "",
    password: "",
    gender: "",
  });

  const router = useRouter();

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const { email, username, age, password, gender } = formData;

    // Basic validation
    if (!email || !username || !password || !gender || !age) {
      toast.error("All fields are required.");
      return;
    }

    if (+age < 18 || +age > 59) {
      toast.error("Age must be between 18 and 59.");
      return;
    }

    try {
      const response = await axios.post("/api/users/register", formData);

      if (response.status === 200) {
        toast.success("Account created successfully! You can now log in.");
        router.push("/login");
      }
    } catch (error) {
      const err = error as AxiosError;
      const message =
        err.response?.data || "An error occurred during registration.";
      toast.error(`Error: ${message}`);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Toaster />
      <div className="p-8 max-w-6xl w-full bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Register</h1>
        <p className="text-center mb-4 text-gray-600">Create your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-md focus:outline-none focus:border-blue-500"
            aria-label="Email"
            required
          />

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-3 border rounded-md focus:outline-none focus:border-blue-500"
            aria-label="Username"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 border rounded-md focus:outline-none focus:border-blue-500"
            aria-label="Password"
            required
          />

          <input
            type="number"
            name="age"
            placeholder="Age"
            min={18}
            max={59}
            value={formData.age}
            onChange={handleChange}
            className="w-full p-3 border rounded-md focus:outline-none focus:border-blue-500"
            aria-label="Age"
            required
          />

          <div className="flex justify-center space-x-4 text-lg">
            <label>
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formData.gender === "male"}
                onChange={handleChange}
                className="mr-2"
              />
              Male
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === "female"}
                onChange={handleChange}
                className="mr-2"
              />
              Female
            </label>
          </div>

          <button
            type="submit"
            className="w-full p-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition duration-200"
          >
            Register
          </button>
        </form>

        <div className="mt-6">
          <LoginWithGoogle />
        </div>
        <div className="flex items-center justify-center mt-4">
          <span className="text-gray-500">or</span>
        </div>
      </div>
    </div>
  );
}
