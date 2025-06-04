# Social Media Platform

A modern social media platform built with Next.js, MongoDB, and NextAuth for authentication. This platform allows users to connect, share posts, and interact with others in a secure and user-friendly environment.

## Features

- **User Authentication**
  - Email/Password login
  - Google OAuth integration
  - Secure session management

- **Profile Management**
  - Customizable user profiles
  - Profile picture upload
  - Age and gender information
  - Follow/Unfollow functionality

- **Post Management**
  - Create, read, and delete posts
  - Image upload support via Cloudinary
  - Like/Unlike posts
  - Comment on posts

- **Social Features**
  - User search functionality
  - Follow other users
  - View follower counts
  - Real-time notifications

- **Responsive Design**
  - Mobile-friendly interface
  - Modern UI with Tailwind CSS
  - Smooth animations

## Tech Stack

- **Frontend**
  - Next.js 15.0.2
  - React 19.0.0
  - Tailwind CSS
  - FontAwesome icons

- **Backend**
  - MongoDB with Mongoose
  - NextAuth.js for authentication
  - Cloudinary for image storage

- **Authentication**
  - NextAuth.js
  - Google OAuth
  - Bcrypt for password hashing

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with the following variables:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_SECRET=your_google_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   URL_MONGO=your_mongodb_connection_string
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # Reusable components
│   ├── models/           # MongoDB models
│   └── ...               # Other app features
├── context/              # React context providers
├── dbConfig/            # Database configuration
└── ...                  # Other project files
```

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.