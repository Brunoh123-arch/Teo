import express from "express";
import { z } from "zod";
import { db } from "../../lib/firebase";
import { authenticate } from "../../lib/middleware";

const router = express.Router();

router.post("/saved-places", authenticate, async (req, res) => {
  try {
    const placeData = z.object({
      name: z.string(),
      address: z.string(),
      lat: z.number(),
      lng: z.number(),
      icon: z.string(),
    }).parse(req.body);
    await db.collection("users").doc((req as any).user.uid).collection("savedPlaces").add({
      ...placeData,
      createdAt: new Date(),
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Invalid place data" });
  }
});

router.get("/saved-places", authenticate, async (req, res) => {
  try {
    const uid = (req as any).user.uid;
    const snapshot = await db.collection("users").doc(uid).collection("savedPlaces").get();
    const places = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(places);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch saved places" });
  }
});

router.post("/documents", authenticate, async (req, res) => {
  try {
    const driverId = (req as any).user.uid;
    const { type, url } = req.body;

    if (!type || !url) {
      return res.status(400).json({ error: "Type and URL are required" });
    }

    const docRef = await db.collection("documents").add({
      driverId,
      type,
      url,
      status: "pending",
      createdAt: new Date(),
    });

    // Update user status
    await db.collection("users").doc(driverId).update({
      driverStatus: "pending"
    });

    res.json({ id: docRef.id, success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit document" });
  }
});

router.put("/profile", authenticate, async (req, res) => {
  try {
    const uid = (req as any).user.uid;
    const { name, phone, vehicle } = z.object({
      name: z.string().min(1).optional(),
      phone: z.string().optional(),
      vehicle: z.object({
        model: z.string().optional(),
        plate: z.string().optional(),
        color: z.string().optional(),
        year: z.string().optional()
      }).optional()
    }).parse(req.body);

    const updateData: any = {
      updatedAt: new Date()
    };
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (vehicle) updateData.vehicle = vehicle;

    await db.collection("users").doc(uid).update(updateData);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(400).json({ error: "Failed to update profile" });
  }
});

export default router;
