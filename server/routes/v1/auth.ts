import express from "express";
import { z } from "zod";
import { db } from "../../lib/firebase";
import { authenticate } from "../../lib/middleware";

export default function(io: any) {
  const router = express.Router();

  // User Sync
  router.post("/sync", authenticate, async (req, res) => {
    try {
      const { name, email } = z.object({
        name: z.string().nullable(),
        email: z.string().nullable(),
      }).parse(req.body);
      const uid = (req as any).user.uid;
      const userRef = db.collection("users").doc(uid);
      const doc = await userRef.get();
      if (!doc.exists) {
        await userRef.set({
          uid,
          name,
          email,
          role: "user",
          driverStatus: "none",
          isOnline: false,
          createdAt: new Date(),
        });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to sync user" });
    }
  });

  // FCM Token
  router.patch("/fcm-token", authenticate, async (req, res) => {
    try {
      const { token } = z.object({ token: z.string() }).parse(req.body);
      await db.collection("users").doc((req as any).user.uid).update({ fcmToken: token });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Invalid token" });
    }
  });

  // Vehicle Profile
  router.patch("/vehicle", authenticate, async (req, res) => {
    try {
      const vehicleData = z.object({
        model: z.string(),
        color: z.string(),
        plate: z.string(),
        cnhUrl: z.string().optional(),
        crlvUrl: z.string().optional(),
      }).parse(req.body);
      await db.collection("users").doc((req as any).user.uid).update({
        vehicle: vehicleData,
        driverStatus: "pending",
      });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Invalid vehicle data" });
    }
  });

  // Driver Data
  router.patch("/driver-data", authenticate, async (req, res) => {
    try {
      const { driverData } = z.object({ driverData: z.any() }).parse(req.body);
      await db.collection("users").doc((req as any).user.uid).update({
        driverData,
        driverStatus: "pending",
        rejectionReason: null
      });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Invalid driver data" });
    }
  });

  // Online Status
  router.patch("/online-status", authenticate, async (req, res) => {
    try {
      const { isOnline } = z.object({ isOnline: z.boolean() }).parse(req.body);
      const uid = (req as any).user.uid;
      await db.collection("users").doc(uid).update({ isOnline });
      
      if (isOnline) {
        const userDoc = await db.collection("users").doc(uid).get();
        const userData = userDoc.data();
        const driverData = {
          uid,
          isOnline: true,
          lastUpdate: new Date(),
          vehicle: userData?.vehicle || null,
          lat: 0,
          lng: 0,
        };
        await db.collection("drivers").doc(uid).set(driverData, { merge: true });
        
        // Broadcast driver online status
        io.to("drivers").emit("driver-moved", driverData);
      } else {
        await db.collection("drivers").doc(uid).update({ isOnline: false, lastUpdate: new Date() });
        
        // Broadcast driver offline status
        io.to("drivers").emit("driver-moved", { uid, isOnline: false, lastUpdate: new Date() });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to toggle online status" });
    }
  });

  // Delete Account
  router.delete("/me", authenticate, async (req, res) => {
    try {
      const uid = (req as any).user.uid;
      await db.collection("users").doc(uid).update({
        deleted: true,
        deletedAt: new Date(),
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  return router;
}
