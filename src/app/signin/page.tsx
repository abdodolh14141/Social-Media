"use client";

import { useState, FormEvent } from "react";
import LoginWithGoogle from "../components/buttons/LoginWithGoogle";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import axios from "axios";

// Define the type for form data
interface FormData {
  email: string;
  username: string;
  age: string;
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const { email, username, age, password, gender } = formData;

    if (!email || !username || !password || !gender || !age) {
      toast.error("All fields are required.");
      return;
    }

    try {
      const response = await axios.post("/api/users/register", formData);

      if (response.status === 200) {
        toast.success("Account created successfully! You can now log in.");
        router.push("/login");
      }
    } catch (err) {
      toast.error("Error registering account. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen shadow-2xl">
      <Toaster />
      <div className="p-6 max-w-5xl w-full bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-center mb-4">Register</h1>
        <p className="text-center mb-6 text-gray-500">Create your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-md focus:outline-none focus:border-blue-500"
            required
          />

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-3 border rounded-md focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 border rounded-md focus:outline-none focus:border-blue-500"
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
            required
          />
          <div className="flex justify-center items-center space-x-4 text-lg">
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
        <div className="flex items-center justify-center mt-4">
          <span className="text-gray-500">or</span>
        </div>
        <div className="mt-4">
          <LoginWithGoogle />
        </div>
      </div>
    </div>
  );
}
