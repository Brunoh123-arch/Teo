import express from "express";
import { z } from "zod";
import { db } from "../../lib/firebase";
import { authenticate } from "../../lib/middleware";

export default function(io: any) {
  const router = express.Router();
  
  // Use middleware to inject io
  router.use((req, res, next) => {
    (req as any).io = io;
    next();
  });

  router.patch("/location", authenticate, async (req, res) => {
    try {
      const { lat, lng, activeRideId } = z.object({
        lat: z.number(),
        lng: z.number(),
        activeRideId: z.string().optional().nullable(),
      }).parse(req.body);
      const uid = (req as any).user.uid;
      
      const batch = db.batch();
      batch.set(db.collection("drivers").doc(uid), {
        lat,
        lng,
        lastUpdate: new Date(),
        isOnline: true,
      }, { merge: true });
      
      if (activeRideId) {
        batch.update(db.collection("rides").doc(activeRideId), {
          driverLat: lat,
          driverLng: lng,
        });
      }
      
      await batch.commit();

      // Broadcast location update via Socket.io
      io.to("drivers").emit("driver-moved", { uid, lat, lng, activeRideId });
      if (activeRideId) {
        io.to(`ride-${activeRideId}`).emit("driver-location-updated", { lat, lng });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to update location" });
    }
  });

  router.get("/nearby", authenticate, async (req, res) => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const snapshot = await db.collection("drivers")
        .where("isOnline", "==", true)
        .where("lastUpdate", ">=", fiveMinutesAgo)
        .get();
      
      const drivers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch nearby drivers" });
    }
  });

  router.get("/earnings", authenticate, async (req, res) => {
    try {
      const uid = (req as any).user.uid;
      
      // Get all completed rides for this driver
      const snapshot = await db.collection("rides")
        .where("driverId", "==", uid)
        .where("status", "==", "completed")
        .get();

      const rides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate daily earnings (today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let dailyEarnings = 0;
      let weeklyEarnings = 0;
      
      // Calculate weekly earnings (last 7 days)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      lastWeek.setHours(0, 0, 0, 0);

      // Group by day for chart
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const chartData = days.map(day => ({ day, earnings: 0 }));

      rides.forEach((ride: any) => {
        if (!ride.createdAt) return;
        const rideDate = ride.createdAt.toDate ? ride.createdAt.toDate() : new Date(ride.createdAt);
        
        const driverCut = (ride.price || 0) * 0.8;

        if (rideDate >= today) {
          dailyEarnings += driverCut;
        }
        
        if (rideDate >= lastWeek) {
          weeklyEarnings += driverCut;
          const dayIndex = rideDate.getDay();
          chartData[dayIndex].earnings += driverCut;
        }
      });

      // Reorder chartData so today is the last item
      const todayIndex = today.getDay();
      const orderedChartData = [
        ...chartData.slice(todayIndex + 1),
        ...chartData.slice(0, todayIndex + 1)
      ];

      res.json({
        dailyEarnings,
        weeklyEarnings,
        chartData: orderedChartData
      });
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.status(500).json({ error: "Failed to fetch earnings" });
    }
  });

  router.get("/heatmap", authenticate, async (req, res) => {
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const snapshot = await db.collection("rides")
        .where("createdAt", ">=", twoHoursAgo)
        .where("status", "in", ["searching", "accepted", "arrived", "in_progress"])
        .get();
      
      const heatmapData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          lat: data.originLat,
          lng: data.originLng,
        };
      });
      
      res.json(heatmapData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch heatmap data" });
    }
  });

  return router;
}
