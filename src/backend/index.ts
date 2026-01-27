import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { Server } from 'socket.io';
import { Connect } from '../dbConfig/dbConfig';
import { postsRoutes } from './routes/posts';
import { createMessagesRoutes } from './routes/messages';
import { usersRoutes } from './routes/users';
import { emailRoutes } from './routes/email';

// Initialize Database Connection
Connect().then(() => {
    console.log('Backend connected to MongoDB');
}).catch((err) => {
    console.error('Backend failed to connect to MongoDB', err);
});

const app = new Elysia();

app.use(cors({
    origin: true, // Allow all for dev
}));

// Route Registration
app.onRequest(({ set }) => {
    set.headers['X-Content-Type-Options'] = 'nosniff';
    set.headers['X-Frame-Options'] = 'DENY';
    set.headers['X-XSS-Protection'] = '1; mode=block';
    set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    set.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' ws: wss: https:;";
});

app.get('/', () => 'Elysia Backend Running');

// Initialize Server & Socket.IO first to pass to routes
const server = app.listen(4000);
console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

const io = new Server(server.server, {
    cors: {
        origin: "*", // Allow all for dev
        methods: ["GET", "POST"]
    }
});

// Register routes
app.use(postsRoutes);
app.use(createMessagesRoutes(io));
app.use(usersRoutes);
app.use(emailRoutes);

io.on('connection', (socket) => {
    console.log('Socket client connected:', socket.id);
    
    // Join user to their own room for private messaging
    socket.on('join-room', (userId) => {
         socket.join(userId);
         console.log(`User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
        console.log('Socket client disconnected:', socket.id);
    });
});

export type App = typeof app;
export { io };
