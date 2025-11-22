This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Social Media Platform

II. ✨ Core Features & Functionality
The platform will include the following essential social networking features:

1. User Authentication & Authorization:

Dual Login: Allow users to register and log in using traditional email/password methods or via Google/Gmail OAuth integration.

Secure Session Management: Implement JWT-based session handling using NextAuth.js for secure and persistent user sessions.

2. Content Creation & Interaction:

Post Creation: Authenticated users must be able to add new text and image posts to the feed.

Engagement: Users can like (toggle) and comment on any post.

Image Handling: Upload and store images securely using an external service like Cloudflare R2 or a similar cloud storage solution.

3. User Profile & Social Graph:

User Profile Page: Dedicated page displaying the user's information, their posts, and metrics (followers/following count).

Follow System: Implement a follower/following mechanism to build a social graph.

4. Search & Discovery:

Search Bar: A dedicated account search bar allowing users to find other profiles by username or name.


III. 🛠️ Technical Focus & Quality Goals
These points elevate the project from a simple feature list to a focus on developer best practices and user performance:

5. Performance Optimization:

Fast Post Retrieval: Implement efficient data fetching and caching strategies (e.g., server-side rendering, memoization, optimized database queries) to achieve high-speed performance when fetching and displaying posts on the main feed.

6. Code Quality & Maintainability:

Clean Code Principles: Adhere to established principles (e.g., DRY, clear naming conventions, modular component structure) to ensure the codebase is clean, readable, and easy to maintain/scale.

TypeScript (Recommended): Use TypeScript for better type safety and developer experience.

7. Modern Development Stack (Implied):

Next.js Features: Leverage Next.js features like API routes (or Server Actions) for the backend and React Server Components where appropriate for optimized performance.
