export default function About() {
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6 bg-blue-500 m-3 rounded-lg">
      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-4">
        About Us
      </h1>
      <p className="text-lg text-gray-600 leading-relaxed">
        Welcome to [Your Platform Name]! We are a social platform designed to
        connect people, inspire ideas, and foster communities around the world.
        Our mission is to provide a safe, engaging, and inclusive space where
        everyone can share their stories, experiences, and passions.
      </p>
      <h2 className="text-2xl font-semibold text-gray-800">Our Vision</h2>
      <p className="text-lg text-gray-600 leading-relaxed">
        At [Your Platform Name], we believe in the power of community. Our
        vision is to create a platform where people from diverse backgrounds can
        come together, connect, and support each other in meaningful ways.
        Whether you’re looking to stay connected with friends, share your
        thoughts, or discover new ideas, our goal is to be your go-to platform
        for social connection.
      </p>
      <h2 className="text-2xl font-semibold text-gray-800">Features</h2>
      <ul className="list-disc pl-8 text-lg text-gray-600 space-y-2">
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
      <h2 className="text-2xl font-semibold text-gray-800">Join Us</h2>
      <p className="text-lg text-gray-600 leading-relaxed">
        We’re constantly evolving, and we’re excited to have you with us on this
        journey. Join us today and be a part of a growing community that values
        openness, creativity, and positive interactions. Together, let's build a
        social experience that empowers everyone.
      </p>
      <div>
        <h3 className="text-center text-2xl">Links</h3>
        <ul className="flex justify-around items-center m-5 p-5 text-xl text-green-800 font-bold">
          <li>
            <a href="https://www.linkedin.com/in/abdo-adel-soliman-94665124a/">
              LinkedIn
            </a>
          </li>
          <li>
            <a href="https://github.com/abdodolh14141" target="_blank">
              Github
            </a>
          </li>
          <li>
            <a href="https://www.instagram.com/just_dolh/">Instagram</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
