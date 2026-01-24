<<<<<<< HEAD
# 🌍 Social Web - Next-Gen Social Media Platform
=======
**# Social Web - Modern Social Media Platform
>>>>>>> origin/master

> **Live Demo:** [**Explore Social Web**](https://social-media-one-sigma.vercel.app?_vercel_share=EtJs1cxgDHHgvdytf7pM8dMt45HGTWKW)

A high-performance, full-stack social media application built with the latest web technologies. Designed for speed, scalability, and a premium user experience.

---

## 🚀 Key Features

### 🔐 Advanced Authentication & Security
- **Multi-Method Login**: Sign in securely using **Google (OAuth)** or traditional Email/Password.
- **Secure Data**: All sensitive data is encrypted and stored securely in **MongoDB**.
- **Password Recovery**: Integrated **OTP (One-Time Password)** system using **Nodemailer** for secure password resets via Gmail.
- **Security Best Practices**: Protection against ReDoS, XSS, and data exposure.

### 📸 Rich Media & Content
- **Create Posts**: Share your thoughts with text and high-quality images.
- **Cloud Storage**: All photos are optimized and served globally via **Cloudinary**.
- **Engagement**: Like posts and join conversations with real-time comments.

### 👥 Social Connectivity
- **Follow System**: Build your network by following other users.
- **User Profiles**: Customizable profiles showcasing activity and followers.
- **Smart Search**: Instantly find any user account with optimized search functionality.

### ⚡ Performance & Quality
- **Clean Code Architecture**: Built with a focus on maintainability, scalability, and modern coding standards.
- **Speed**: Optimized database queries and frontend performance for a lag-free experience.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (React 19)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) for a sleek, responsive design.
- **State Management**: [TanStack Query](https://tanstack.com/query) for efficient data fetching.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth interactions.

### Backend & Database
- **API Framework**: [ElysiaJS](https://elysiajs.com/) (running on Bun) for lightning-fast API responses.
- **Database**: [MongoDB](https://www.mongodb.com/) with Mongoose for flexible data modeling.
- **Real-Time**: [Socket.IO](https://socket.io/) for instant updates.
- **Email Service**: [Nodemailer](https://nodemailer.com/) for reliable transactional emails.

---

## 📦 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Bun** (for backend)
- **MongoDB** Connection String

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/abdodolh14141/Social-Media.git
    cd Social-Media
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # or
    bun install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory:

    ```env
    # Database
    URL_MONGO=your_mongodb_connection_string

    # Authentication (NextAuth)
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your_secret_key
    
    # OAuth (Google)
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret

    # Cloudinary (Images)
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret

    # Email (Nodemailer)
    EMAIL_USER=your_gmail_address
    EMAIL_PASS=your_gmail_app_password
    ```

4.  **Run the Application**
    Launch both Frontend and Backend concurrently:
    ```bash
    npm run dev
    ```
    - Frontend: `http://localhost:3000`
    - Backend: `http://localhost:4000`

---

## 🤝 Contributing

This project is a continuous learning journey focused on code quality and exploring new tools. Contributions, suggestions, and feature requests are welcome!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

<<<<<<< HEAD
---

## 📜 License

Distributed under the MIT License.
=======
This project is open-source.
**
>>>>>>> origin/master
