**# Social Web - Modern Social Media Platform

A full-stack social media application built with modern technologies, featuring real-time messaging, post interactions, and a responsive UI.

## 🚀 Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (React 19)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State/Fetching**: [TanStack Query](https://tanstack.com/query) & [SWR](https://swr.vercel.app/)
- **Icons**: [Lucide React](https://lucide.dev/) & FontAwesome

### Backend
- **Framework**: [ElysiaJS](https://elysiajs.com/)
- **Runtime**: [Bun](https://bun.sh/) (Backend execution) & Node.js (Frontend)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Real-time**: [Socket.IO](https://socket.io/)

### Authentication & Tools
- **Auth**: [NextAuth.js](https://next-auth.js.org/)
- **Image Storage**: Cloudinary (`next-cloudinary`)
- **Language**: TypeScript

## 🛠️ Prerequisites

- **Node.js** (v18+ recommended)
- **Bun** (Required for the Elysia backend) - [Install Bun](https://bun.sh/docs/installation)
- **MongoDB** instance (Local or Atlas)

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/abdodolh14141/Social-Media.git
    cd Social-Media
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory with the following variables:

    ```env
    # Database
    URL_MONGO=mongodb://localhost:27017/social_media # Or your MongoDB Atlas URL

    # NextAuth (Authentication)
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your_super_secret_key
    
    # OAuth Providers (Google Example)
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret

    # Cloudinary (Image Uploads)
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
    ```

## 🏃‍♂️ Running the Project

The project uses `concurrently` to run both the Next.js frontend and Elysia backend in a single command.

```bash
npm run dev
```

- **Frontend**: Runs on `http://localhost:3000`
- **Backend API**: Runs on `http://localhost:4000` (Elysia)

### Separate Execution

If you prefer running them separately:

- **Frontend only**: `npm run dev:frontend`
- **Backend only**: `npm run dev:backend` (requires Bun)

## 📁 Project Structure

```
├── src
│   ├── app              # Next.js App Router (Frontend Pages & Components)
│   │   ├── components   # Reusable UI components (Posts, Navbar, etc.)
│   │   ├── models       # Mongoose Schemas (Shared)
│   │   └── ...
│   ├── backend          # ElysiaJS Backend
│   │   ├── index.ts     # Backend Entry Point
│   │   └── routes       # API Routes (posts, users, messages)
│   ├── dbConfig         # Database Connection Logic
│   └── ...
├── public               # Static Assets
└── package.json         # Project Dependencies & Scripts
```

## ✨ Key Features

- **User Authentication**: Secure login/register with NextAuth.
- **Feed System**: Create posts with text and images.
- **Interactions**: Like and comment on posts.
- **Profiles**: User profiles with follower/following stats.
- **Real-time Messaging**: Chat with other users (powered by Socket.IO).
- **Search**: Find users and profiles.
- **Responsive Design**: Optimized for all devices.

## 🔒 Security Measures

- **Data Protection**: Sensitive fields (passwords) are excluded from default queries.
- **API Security**: ReDoS protection and Security Headers (Helmet-style) implemented.
- **Input Validation**: Strict type checking and validation on API inputs.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

## 📄 License

This project is open-source.
**
