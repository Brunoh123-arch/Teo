import express from "express";
import { db } from "../../lib/firebase";
import { authenticate } from "../../lib/middleware";

const router = express.Router();

router.post("/", authenticate, async (req, res) => {
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

export default router;
