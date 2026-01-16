import Contact from "@/app/contact/page";

export default function () {
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6 text-white m-3 rounded-lg">
      <h1 className="text-4xl font-extrabold text-center text-white mb-4 animate-fade-in-down">
        About Us
      </h1>
      <p className="text-lg text-white leading-relaxed animate-fade-in-up">
        Welcome to Social App! We are a social platform designed to connect
        people, inspire ideas, and foster communities around the world. Our
        mission is to provide a safe, engaging, and inclusive space where
        everyone can share their stories, experiences, and passions.
      </p>
      <h2 className="text-2xl font-semibold text-white animate-fade-in-left">
        Our Vision
      </h2>
      <p className="text-lg text-white leading-relaxed animate-fade-in-right">
        At Social App, we believe in the power of community. Our vision is to
        create a platform where people from diverse backgrounds can come
        together, connect, and support each other in meaningful ways. Whether
        you’re looking to stay connected with friends, share your thoughts, or
        discover new ideas, our goal is to be your go-to platform for social
        connection.
      </p>
      <p className="font-bold text-black">
        Created By: Abdulrahman Adel Soliman
      </p>
      <h2 className="text-2xl font-semibold text-white animate-fade-in-left">
        Features
      </h2>
      <ul className="list-disc pl-8 text-lg text-white space-y-2 animate-fade-in-up">
        <li>
          Share your moments and stories with photos, videos, and updates.
        </li>
        <li>
          Connect with friends and meet new people with similar interests.
        </li>
        <li>Express yourself with likes, comments, and shares.</li>
        <li>
          Join communities and participate in discussions around your passions.
        </li>
      </ul>
      <h2 className="text-2xl font-semibold text-white animate-fade-in-right">
        Join Us
      </h2>
      <p className="text-lg text-white leading-relaxed animate-fade-in-up">
        We’re constantly evolving, and we’re excited to have you with us on this
        journey. Join us today and be a part of a growing community that values
        openness, creativity, and positive interactions. Together, let's build a
        social experience that empowers everyone.
      </p>
      <div className="animate-fade-in">
        <Contact />
      </div>
    </div>
  );
}
