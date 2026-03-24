import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { MercadoPagoConfig, Payment } from 'mercadopago';
import authRouter from "./server/routes/v1/auth";
import ridesRouter from "./server/routes/v1/rides";
import adminRouter from "./server/routes/v1/admin";
import usersRouter from "./server/routes/v1/users";
import driversRouter from "./server/routes/v1/drivers";
import walletRouter from "./server/routes/v1/wallet";
import couponsRouter from "./server/routes/v1/coupons";
import supportRouter from "./server/routes/v1/support";

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' });
const payment = new Payment(client);

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const auth = getAuth();
const messaging = getMessaging();

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes"
});

// Helper to send push notifications
async function sendNotification(uid: string, title: string, body: string, data: any = {}) {
  try {
    const userDoc = await db.collection("users").doc(uid).get();
    const fcmToken = userDoc.data()?.fcmToken;
    if (fcmToken) {
      await messaging.send({
        token: fcmToken,
        notification: { title, body },
        data: { ...data, click_action: "FLUTTER_NOTIFICATION_CLICK" },
      });
      console.log(`Notification sent to ${uid}: ${title}`);
    }
  } catch (error) {
    console.error(`Error sending notification to ${uid}:`, error);
  }
}

// Schemas de Validação
const RideSchema = z.object({
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  destName: z.string(),
  price: z.number(),
  paymentMethod: z.enum(["pix", "dinheiro", "cartao"]),
});

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  app.use(express.json());
  app.use("/api/", limiter);

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-ride", (rideId) => {
      socket.join(`ride-${rideId}`);
      console.log(`User ${socket.id} joined ride room: ride-${rideId}`);
    });

    socket.on("join-support", (ticketId) => {
      socket.join(`support-${ticketId}`);
      console.log(`User ${socket.id} joined support room: support-${ticketId}`);
    });

    socket.on("join-drivers", () => {
      socket.join("drivers");
      console.log(`User ${socket.id} joined drivers room`);
    });

    socket.on("update-location", (data) => {
      // Broadcast driver location to the specific ride room if applicable
      if (data.rideId) {
        io.to(`ride-${data.rideId}`).emit("driver-location-updated", data);
      }
      // Also broadcast to a general drivers room for admin/nearby tracking if needed
      io.to("drivers").emit("driver-moved", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Helper to broadcast ride updates
  const broadcastRideUpdate = (rideId: string, data: any) => {
    io.to(`ride-${rideId}`).emit("ride-updated", { id: rideId, ...data });
    // If it's a new ride, notify all drivers
    if (data.status === "searching") {
      io.to("drivers").emit("new-ride-available", { id: rideId, ...data });
    }
  };

  const broadcastChatMessage = (rideId: string, message: any) => {
    io.to(`ride-${rideId}`).emit("new-message", message);
  };

  // Middleware para verificar token de autenticação
  const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decodedToken = await auth.verifyIdToken(token);
      (req as any).user = decodedToken;
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/v1/auth", authRouter(io));
  app.use("/api/v1/rides", ridesRouter(io));
  app.use("/api/v1/admin", adminRouter(io));
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/drivers", driversRouter(io));
  app.use("/api/v1/wallet", walletRouter);
  app.use("/api/v1/coupons", authenticate, couponsRouter);
  app.use("/api/v1/support", authenticate, supportRouter(io));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
