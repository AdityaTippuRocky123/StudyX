import mongoose from "mongoose";
import express from "express";
import { createServer as createHttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import leaderboardRoutes from "./routes/leaderboardRoutes";

// Load environment variables
dotenv.config();

interface Participant {
  id: string;
  socketId: string;
  name: string;
  isBot: boolean;
  subject: string;
  camActive: boolean;
  micActive: boolean;
  screenSharing: boolean;
  speaking: boolean;
  studyMinutes: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  isBot?: boolean;
}

interface PomodoroState {
  isRunning: boolean;
  duration: number; // in seconds
  mode: "focus" | "shortBreak" | "longBreak";
  lastUpdated: number;
}

interface Room {
  roomId: string;
  participants: Participant[];
  messages: ChatMessage[];
  pomodoro: PomodoroState;
}

const app = express();
const httpServer = createHttpServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

// In-memory Room State
const rooms: Record<string, Room> = {};

// Helper to seed a room with supportive study bots
function seedBots(roomId: string): Participant[] {
  return [
    {
      id: `bot-elena-${roomId}`,
      socketId: "bot",
      name: "Elena (Calculus)",
      isBot: true,
      subject: "Calculus II",
      camActive: true,
      micActive: false,
      screenSharing: false,
      speaking: false,
      studyMinutes: 125
    },
    {
      id: `bot-marcus-${roomId}`,
      socketId: "bot",
      name: "Marcus (AI Dev)",
      isBot: true,
      subject: "Artificial Intelligence",
      camActive: false,
      micActive: false,
      screenSharing: true,
      speaking: false,
      studyMinutes: 180
    },
    {
      id: `bot-yuki-${roomId}`,
      socketId: "bot",
      name: "Yuki (OS)",
      isBot: true,
      subject: "Operating Systems",
      camActive: true,
      micActive: false,
      screenSharing: false,
      speaking: false,
      studyMinutes: 90
    }
  ];
}

// Bot comments database
const BOT_PHRASES = [
  "Let's focus up! We have some major targets to hit today.",
  "That last session was intense. Time to grind through the next block!",
  "Operating systems scheduling algorithm notes are getting dense. Anyone studying threads?",
  "Calculus limit theorems are finally clicking. Practice makes perfect!",
  "Just enabled Focus Mode, let's keep distractions at zero.",
  "Remember to hydrate while focusing!",
  "A synchronized Pomodoro makes this so much easier. Let's do this!",
  "Does anyone want to review AI neural network backpropagation during the break?",
  "Perfect timing, starting the focus session now!"
];

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  console.log("Mongo URI:", process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^:@]+)@/, ":****@") : undefined);
  console.log("Mongoose readyState:", mongoose.connection.readyState);

  // Middleware for parsing JSON requests
  app.use(express.json());

  // Mount Auth routes
  app.use("/api/auth", authRoutes);

  // Mount User routes
  app.use("/api/user", userRoutes);

  // Mount Leaderboard routes
  app.use("/api/leaderboard", leaderboardRoutes);

  // API Endpoint - Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // API Endpoint - active rooms lookup
  app.get("/api/rooms", (req, res) => {
    const list = Object.keys(rooms).map(id => ({
      roomId: id,
      participantCount: rooms[id].participants.length,
      currentSubject: rooms[id].participants.find(p => !p.isBot)?.subject || "General Studying",
      pomodoroMode: rooms[id].pomodoro.mode
    }));
    res.json(list);
  });

  // Socket.io Implementation
  io.on("connection", (socket) => {
    let currentRoomId: string | null = null;
    let participantId: string | null = null;

    socket.on("room:join", ({ roomId, name, subject, camActive, micActive }) => {
      currentRoomId = roomId;
      participantId = `user-${socket.id}`;

      // Create room if it doesn't exist
      if (!rooms[roomId]) {
        rooms[roomId] = {
          roomId,
          participants: seedBots(roomId),
          messages: [
            {
              id: `sys-welcome-${roomId}`,
              senderId: "system",
              senderName: "StudyX",
              text: `Welcome to Study Room: ${roomId}! Synchronized study timers and chat are active.`,
              timestamp: new Date().toISOString(),
              isSystem: true
            }
          ],
          pomodoro: {
            isRunning: false,
            duration: 1500, // 25 mins
            mode: "focus",
            lastUpdated: Date.now()
          }
        };
      }

      // Add user participant
      const userParticipant: Participant = {
        id: participantId,
        socketId: socket.id,
        name: name || `Scholar #${socket.id.substring(0, 4)}`,
        isBot: false,
        subject: subject || "General Studying",
        camActive: !!camActive,
        micActive: !!micActive,
        screenSharing: false,
        speaking: false,
        studyMinutes: 0
      };

      rooms[roomId].participants.push(userParticipant);
      socket.join(roomId);

      // Broadcast system join notification
      const joinMessage: ChatMessage = {
        id: `sys-join-${socket.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: "system",
        senderName: "StudyX",
        text: `${userParticipant.name} has entered the room.`,
        timestamp: new Date().toISOString(),
        isSystem: true
      };
      rooms[roomId].messages.push(joinMessage);

      // Send initial state to the joining user
      socket.emit("room:initial_state", {
        room: rooms[roomId]
      });

      // Broadcast updated participant list and join message
      io.to(roomId).emit("room:updated", {
        participants: rooms[roomId].participants
      });
      socket.to(roomId).emit("chat:message", joinMessage);

      // Trigger occasional bot comments to welcome the user
      setTimeout(() => {
        if (!rooms[roomId]) return;
        const bots = rooms[roomId].participants.filter(p => p.isBot);
        if (bots.length > 0) {
          const randomBot = bots[Math.floor(Math.random() * bots.length)];
          const botMessage: ChatMessage = {
            id: `bot-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            senderId: randomBot.id,
            senderName: randomBot.name,
            text: `Hey ${userParticipant.name}! Great to have you study with us. What are we working on today?`,
            timestamp: new Date().toISOString(),
            isBot: true
          };
          rooms[roomId].messages.push(botMessage);
          io.to(roomId).emit("chat:message", botMessage);
        }
      }, 1500);
    });

    socket.on("participant:update", (updatedFields) => {
      if (!currentRoomId || !participantId || !rooms[currentRoomId]) return;

      rooms[currentRoomId].participants = rooms[currentRoomId].participants.map(p => {
        if (p.id === participantId) {
          return { ...p, ...updatedFields };
        }
        return p;
      });

      io.to(currentRoomId).emit("room:updated", {
        participants: rooms[currentRoomId].participants
      });
    });

    socket.on("chat:message", (text) => {
      if (!currentRoomId || !participantId || !rooms[currentRoomId]) return;

      const user = rooms[currentRoomId].participants.find(p => p.id === participantId);
      if (!user) return;

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: participantId,
        senderName: user.name,
        text,
        timestamp: new Date().toISOString()
      };

      rooms[currentRoomId].messages.push(userMsg);
      io.to(currentRoomId).emit("chat:message", userMsg);

      // Bot reactive responses (25% chance or if a bot is mentioned)
      const mentionedBot = rooms[currentRoomId].participants.find(
        p => p.isBot && text.toLowerCase().includes(p.name.split(" ")[0].toLowerCase())
      );
      const shouldRespond = mentionedBot || Math.random() < 0.35;

      if (shouldRespond) {
        setTimeout(() => {
          if (!currentRoomId || !rooms[currentRoomId]) return;
          const bots = rooms[currentRoomId].participants.filter(p => p.isBot);
          if (bots.length === 0) return;

          const activeBot = mentionedBot || bots[Math.floor(Math.random() * bots.length)];

          // Animate bot speaking indicator
          io.to(currentRoomId).emit("room:updated", {
            participants: rooms[currentRoomId].participants.map(p =>
              p.id === activeBot.id ? { ...p, speaking: true } : p
            )
          });

          setTimeout(() => {
            if (!currentRoomId || !rooms[currentRoomId]) return;
            const phrase = BOT_PHRASES[Math.floor(Math.random() * BOT_PHRASES.length)];
            const botMsg: ChatMessage = {
              id: `bot-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              senderId: activeBot.id,
              senderName: activeBot.name,
              text: mentionedBot ? `Replying to you: ${phrase}` : phrase,
              timestamp: new Date().toISOString(),
              isBot: true
            };

            rooms[currentRoomId].messages.push(botMsg);
            io.to(currentRoomId).emit("chat:message", botMsg);

            // Re-turn off speaking
            rooms[currentRoomId].participants = rooms[currentRoomId].participants.map(p =>
              p.id === activeBot.id ? { ...p, speaking: false } : p
            );
            io.to(currentRoomId).emit("room:updated", {
              participants: rooms[currentRoomId].participants
            });
          }, 1200);

        }, 1500);
      }
    });

    socket.on("pomodoro:update", (updatedState: Partial<PomodoroState>) => {
      if (!currentRoomId || !rooms[currentRoomId]) return;

      rooms[currentRoomId].pomodoro = {
        ...rooms[currentRoomId].pomodoro,
        ...updatedState,
        lastUpdated: Date.now()
      };

      io.to(currentRoomId).emit("pomodoro:updated", rooms[currentRoomId].pomodoro);

      // Send system message about state change
      let statusText = "";
      if (updatedState.mode) {
        statusText = `Timer mode changed to ${updatedState.mode === "focus" ? "Focus Session" : updatedState.mode === "shortBreak" ? "Short Break" : "Long Break"}.`;
      } else if (updatedState.isRunning !== undefined) {
        statusText = `Timer ${updatedState.isRunning ? "started" : "paused"} by participant.`;
      }

      if (statusText) {
        const sysMsg: ChatMessage = {
          id: `sys-pomo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          senderId: "system",
          senderName: "StudyX",
          text: statusText,
          timestamp: new Date().toISOString(),
          isSystem: true
        };
        rooms[currentRoomId].messages.push(sysMsg);
        io.to(currentRoomId).emit("chat:message", sysMsg);
      }
    });

    // Simulating Bot activities and study time incrementing on interval
    const botInterval = setInterval(() => {
      if (!currentRoomId || !rooms[currentRoomId]) return;

      let changed = false;
      rooms[currentRoomId].participants = rooms[currentRoomId].participants.map(p => {
        if (p.isBot) {
          // Increment study minutes slowly
          const increment = Math.random() < 0.08 ? 1 : 0;
          // Trigger speaking active state occasionally (to make indicator blink)
          const speakingState = Math.random() < 0.05;
          if (increment > 0 || speakingState !== p.speaking) {
            changed = true;
            return {
              ...p,
              studyMinutes: p.studyMinutes + increment,
              speaking: speakingState
            };
          }
        } else {
          // Increment actual user's study minutes if the timer is running
          if (rooms[currentRoomId!].pomodoro.isRunning) {
            const increment = Math.random() < 0.08 ? 1 : 0;
            if (increment > 0) {
              changed = true;
              return {
                ...p,
                studyMinutes: p.studyMinutes + increment
              };
            }
          }
        }
        return p;
      });

      if (changed) {
        io.to(currentRoomId).emit("room:updated", {
          participants: rooms[currentRoomId].participants
        });
      }
    }, 5000);

    // Disconnect handling
    socket.on("disconnect", () => {
      clearInterval(botInterval);

      if (currentRoomId && participantId && rooms[currentRoomId]) {
        const user = rooms[currentRoomId].participants.find(p => p.id === participantId);
        const userName = user ? user.name : "A scholar";

        // Remove user
        rooms[currentRoomId].participants = rooms[currentRoomId].participants.filter(p => p.id !== participantId);

        // Send leave notification
        const leaveMsg: ChatMessage = {
          id: `sys-leave-${socket.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          senderId: "system",
          senderName: "StudyX",
          text: `${userName} has left the room.`,
          timestamp: new Date().toISOString(),
          isSystem: true
        };
        rooms[currentRoomId].messages.push(leaveMsg);

        io.to(currentRoomId).emit("room:updated", {
          participants: rooms[currentRoomId].participants
        });
        io.to(currentRoomId).emit("chat:message", leaveMsg);

        // Delete room if empty of real participants
        const realUsers = rooms[currentRoomId].participants.filter(p => !p.isBot);
        if (realUsers.length === 0) {
          delete rooms[currentRoomId];
        }
      }
    });
  });

  // API catch-all: ensure unmatched /api/* requests never fall through to Vite / static index.html
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  // Global JSON error handler for API routes
  app.use("/api/*", (err: any, req: any, res: any, next: any) => {
    console.error("API Route Error:", err);
    res.status(err.status || 500).json({
      error: err.message || "An unexpected database or server-side error occurred"
    });
  });

  // Serve Vite in Development, static build in Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
