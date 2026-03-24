import express from "express";
import { z } from "zod";
import { db } from "../../lib/firebase";
import { authenticate } from "../../lib/middleware";
import { sendNotification } from "../../lib/notifications";

export default function(io: any) {
  const router = express.Router();

  const RideSchema = z.object({
    originLat: z.number(),
    originLng: z.number(),
    destLat: z.number(),
    destLng: z.number(),
    destName: z.string(),
    price: z.number(),
    paymentMethod: z.enum(["pix", "dinheiro", "cartao"]),
    couponCode: z.string().optional(),
  });

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

  // Ride API
  router.post("/", authenticate, async (req, res) => {
    try {
      const { couponCode, ...rideData } = RideSchema.parse(req.body);
      const uid = (req as any).user.uid;
      
      let finalPrice = rideData.price;
      let discountAmount = 0;

      if (couponCode) {
        const couponDoc = await db.collection("coupons").doc(couponCode.toUpperCase()).get();
        if (couponDoc.exists) {
          const couponData = couponDoc.data()!;
          const now = new Date();
          const isExpired = couponData.expiryDate && couponData.expiryDate.toDate() < now;
          const isLimitReached = couponData.usageLimit && couponData.usageCount >= couponData.usageLimit;
          
          if (!isExpired && !isLimitReached) {
            if (couponData.discountType === 'percentage') {
              discountAmount = (rideData.price * couponData.discountValue) / 100;
            } else {
              discountAmount = couponData.discountValue;
            }
            finalPrice = Math.max(0, rideData.price - discountAmount);
            
            // Mark coupon as used by this user (transactional update would be better but let's keep it simple for now)
            await db.collection("coupons").doc(couponCode.toUpperCase())
              .collection("users").doc(uid).set({ usedAt: new Date() });
            
            await db.collection("coupons").doc(couponCode.toUpperCase()).update({
              usageCount: (couponData.usageCount || 0) + 1
            });
          }
        }
      }

      const rideRef = await db.collection("rides").add({
        ...rideData,
        price: finalPrice,
        originalPrice: rideData.price,
        discountAmount,
        couponCode: couponCode || null,
        userId: uid,
        status: "searching",
        createdAt: new Date(),
      });

      const newRide = { 
        id: rideRef.id, 
        ...rideData, 
        price: finalPrice,
        originalPrice: rideData.price,
        discountAmount,
        couponCode: couponCode || null,
        userId: uid, 
        status: "searching", 
        createdAt: new Date() 
      };

      // Broadcast the new ride to all drivers
      io.to("drivers").emit("new-ride-available", newRide);

      res.json({ id: rideRef.id });
    } catch (error) {
      console.error("Error creating ride:", error);
      res.status(400).json({ error: "Invalid ride data" });
    }
  });

  router.post("/:id/messages", authenticate, async (req, res) => {
    try {
      const { text } = z.object({ text: z.string() }).parse(req.body);
      const rideId = req.params.id;
      const senderId = (req as any).user.uid;

      const messageRef = await db.collection("rides").doc(rideId).collection("messages").add({
        text,
        senderId,
        timestamp: new Date(),
      });

      const message = {
        id: messageRef.id,
        text,
        senderId,
        timestamp: new Date(),
      };

      // Broadcast message via Socket.io
      broadcastChatMessage(rideId, message);

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  router.get("/active", authenticate, async (req, res) => {
    try {
      const { mode } = z.object({ mode: z.enum(["rider", "driver"]) }).parse(req.query);
      const uid = (req as any).user.uid;
      
      let activeRideQuery;
      if (mode === "driver") {
        activeRideQuery = db.collection("rides")
          .where("driverId", "==", uid)
          .where("status", "in", ["accepted", "arrived", "in_progress"])
          .limit(1);
      } else {
        activeRideQuery = db.collection("rides")
          .where("userId", "==", uid)
          .where("status", "in", ["searching", "selecting", "requesting", "accepted", "arrived", "in_progress"])
          .limit(1);
      }

      const snapshot = await activeRideQuery.get();
      if (snapshot.empty) {
        return res.json(null);
      }

      const doc = snapshot.docs[0];
      res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error("Error fetching active ride:", error);
      res.status(500).json({ error: "Failed to fetch active ride" });
    }
  });

  // Public ride sharing (no authentication)
  router.get("/:id/share", async (req, res) => {
    try {
      const rideDoc = await db.collection("rides").doc(req.params.id).get();
      if (!rideDoc.exists) return res.status(404).json({ error: "Ride not found" });
      
      const rideData = rideDoc.data()!;
      
      // Return only safe, public ride info
      res.json({
        id: rideDoc.id,
        status: rideData.status,
        originName: rideData.originName,
        destName: rideData.destName,
        driverLocation: rideData.driverLocation,
        driverName: rideData.driverName,
        vehicle: rideData.vehicle,
        createdAt: rideData.createdAt
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ride for sharing" });
    }
  });

  router.get("/:id", authenticate, async (req, res) => {
    try {
      const doc = await db.collection("rides").doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: "Ride not found" });
      res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ride" });
    }
  });

  router.get("/available", authenticate, async (req, res) => {
    try {
      const snapshot = await db.collection("rides")
        .where("status", "==", "searching")
        .get();
      const rides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(rides);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available rides" });
    }
  });

  router.post("/:id/accept", authenticate, async (req, res) => {
    try {
      const driverId = (req as any).user.uid;
      const rideId = req.params.id;
      
      const rideRef = db.collection("rides").doc(rideId);
      const driverRef = db.collection("users").doc(driverId);

      const result = await db.runTransaction(async (transaction) => {
        const rideDoc = await transaction.get(rideRef);
        const rideData = rideDoc.data();

        if (!rideData) {
          throw new Error("Ride not found");
        }

        if (rideData.status !== "searching") {
          throw new Error("Ride no longer available");
        }

        const driverDoc = await transaction.get(driverRef);
        const driverInfo = driverDoc.data();
        
        // Also get driver rating from drivers collection
        const driverStatsRef = db.collection("drivers").doc(driverId);
        const driverStatsDoc = await transaction.get(driverStatsRef);
        const driverRating = driverStatsDoc.exists ? (driverStatsDoc.data()?.rating || 5.0) : 5.0;

        const updateData = {
          status: "accepted",
          driverId: driverId,
          acceptedAt: new Date(),
          driverName: driverInfo?.name || "Motorista",
          driverPhoto: driverInfo?.photoURL || "",
          driverRating: driverRating,
          driverVehicle: driverInfo?.vehicle ? {
            model: driverInfo.vehicle.model,
            plate: driverInfo.vehicle.plate,
            color: driverInfo.vehicle.color,
            year: driverInfo.vehicle.year
          } : null,
        };

        transaction.update(rideRef, updateData);

        return { rideData, driverInfo, updateData };
      });

      const { rideData, updateData } = result;

      // Broadcast ride update via Socket.io
      broadcastRideUpdate(rideId, updateData);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Accept ride error:", error);
      const message = error.message === "Ride no longer available" ? error.message : "Failed to accept ride";
      res.status(400).json({ error: message });
    }
  });

  router.post("/:id/cancel", authenticate, async (req, res) => {
    try {
      const rideId = req.params.id;
      
      const rideRef = db.collection("rides").doc(rideId);
      await rideRef.update({ status: "cancelled" });

      const rideDoc = await rideRef.get();
      const rideData = rideDoc.data();

      // Broadcast ride update via Socket.io
      broadcastRideUpdate(rideId, { id: rideId, ...rideData });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel ride" });
    }
  });

  router.patch("/:id/status", authenticate, async (req, res) => {
    try {
      const { status } = z.object({ status: z.string() }).parse(req.body);
      const rideId = req.params.id;
      
      const rideRef = db.collection("rides").doc(rideId);
      
      await db.runTransaction(async (transaction) => {
        const rideDoc = await transaction.get(rideRef);
        if (!rideDoc.exists) throw new Error("Ride not found");
        
        const rideData = rideDoc.data()!;
        
        transaction.update(rideRef, { status });

        // Se a corrida foi finalizada, processa os ganhos
        if (status === "completed" && rideData.driverId && !rideData.walletProcessed) {
          const driverRef = db.collection("users").doc(rideData.driverId);
          const driverDoc = await transaction.get(driverRef);
          
          if (driverDoc.exists) {
            const currentBalance = driverDoc.data()?.walletBalance || 0;
            const ridePrice = rideData.price || 0;
            const driverCut = ridePrice * 0.8;
            const appCut = ridePrice * 0.2;
            
            if (rideData.paymentMethod === "app") {
              // Pagamento via app: motorista recebe 80% na carteira
              transaction.update(driverRef, {
                walletBalance: currentBalance + driverCut
              });

              const transactionRef = db.collection("wallet_transactions").doc();
              transaction.set(transactionRef, {
                userId: rideData.driverId,
                type: 'credit',
                amount: driverCut,
                description: `Ganho da corrida ${rideId.slice(0, 6)}`,
                rideId: rideId,
                createdAt: new Date(),
                status: 'completed'
              });
            } else {
              // Pagamento direto (dinheiro/pix): motorista recebeu 100%, deve 20% ao app
              transaction.update(driverRef, {
                walletBalance: currentBalance - appCut
              });

              const transactionRef = db.collection("wallet_transactions").doc();
              transaction.set(transactionRef, {
                userId: rideData.driverId,
                type: 'debit',
                amount: appCut,
                description: `Taxa da corrida ${rideId.slice(0, 6)} (Pagamento direto)`,
                rideId: rideId,
                createdAt: new Date(),
                status: 'completed'
              });
            }

            // Marcar a corrida como processada na carteira para não duplicar
            transaction.update(rideRef, { walletProcessed: true });
          }
        }
      });

      const updatedRideDoc = await db.collection("rides").doc(rideId).get();
      const rideData = updatedRideDoc.data();

      // Broadcast ride update via Socket.io with full data
      broadcastRideUpdate(rideId, { ...rideData });

      if (rideData) {
        let title = "";
        let body = "";

        if (status === "arrived") {
          title = "Motorista chegou!";
          body = "Seu motorista está no local de embarque.";
        } else if (status === "in_progress") {
          title = "Viagem iniciada";
          body = "Aproveite sua viagem!";
        } else if (status === "completed") {
          title = "Viagem concluída";
          body = "Você chegou ao seu destino. Não esqueça de avaliar!";
        }

        if (title) {
          await sendNotification(rideData.userId, title, body, { rideId, status });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating ride status:", error);
      res.status(400).json({ error: "Failed to update status" });
    }
  });

  router.post("/:id/rate", authenticate, async (req, res) => {
    try {
      const { rating, tip } = z.object({ 
        rating: z.number().min(1).max(5),
        tip: z.number().min(0).optional().default(0)
      }).parse(req.body);
      
      const rideRef = db.collection("rides").doc(req.params.id);
      const rideDoc = await rideRef.get();
      
      if (!rideDoc.exists) {
        return res.status(404).json({ error: "Ride not found" });
      }

      const rideData = rideDoc.data()!;
      
      const updateData: any = { rating };
      if (tip > 0) {
        updateData.tip = tip;
      }
      
      const batch = db.batch();
      batch.update(rideRef, updateData);

      // Update driver's overall rating
      if (rideData.driverId) {
        const driverRef = db.collection("drivers").doc(rideData.driverId);
        const driverDoc = await driverRef.get();
        
        if (driverDoc.exists) {
          const driverData = driverDoc.data()!;
          const currentRating = driverData.rating || 5.0;
          const ratingCount = driverData.ratingCount || 0;
          
          const newRating = ((currentRating * ratingCount) + rating) / (ratingCount + 1);
          
          batch.update(driverRef, {
            rating: newRating,
            ratingCount: ratingCount + 1
          });
        } else {
           batch.set(driverRef, {
            rating: rating,
            ratingCount: 1
          }, { merge: true });
        }
      }

      await batch.commit();

      res.json({ success: true });
    } catch (error) {
      console.error("Error rating ride:", error);
      res.status(400).json({ error: "Invalid rating or tip" });
    }
  });

  router.get("/history", authenticate, async (req, res) => {
    try {
      const { mode } = z.object({ mode: z.enum(["rider", "driver"]).optional() }).parse(req.query);
      const uid = (req as any).user.uid;
      
      let query = db.collection("rides");
      
      if (mode === "driver") {
        query = query.where("driverId", "==", uid) as any;
      } else {
        query = query.where("userId", "==", uid) as any;
      }
      
      const snapshot = await query
        .where("status", "in", ["completed", "cancelled"])
        .orderBy("createdAt", "desc")
        .get();
        
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(history);
    } catch (error) {
      console.error("History error:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // Secure Fare Calculation API
  router.post("/calculate-fare", authenticate, async (req, res) => {
    try {
      const { origin, destination } = z.object({
        origin: z.object({ lat: z.number(), lng: z.number() }),
        destination: z.object({ lat: z.number(), lng: z.number() }),
      }).parse(req.body);

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      );
      
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        const distanceKm = routeData.distance / 1000;
        const durationMin = Math.ceil(routeData.duration / 60);

        // Fetch pricing from Firestore
        let baseFare = 5.0;
        let perKm = 1.5;
        let perMin = 0.3;
        let adminSurgeEnabled = false;
        let adminSurgeMultiplier = 1.0;
        
        try {
          const pricingDoc = await db.collection("settings").doc("pricing").get();
          if (pricingDoc.exists) {
            const pricingData = pricingDoc.data();
            if (pricingData) {
              baseFare = pricingData.baseFare ?? baseFare;
              perKm = pricingData.perKm ?? perKm;
              perMin = pricingData.perMin ?? perMin;
              adminSurgeEnabled = pricingData.surgeEnabled ?? false;
              adminSurgeMultiplier = pricingData.surgeMultiplier ?? 1.0;
            }
          }
        } catch (err) {
          console.error("Error fetching pricing settings, using defaults:", err);
        }

        // Surge Pricing Logic (Tarifa Dinâmica)
        let surgeMultiplier = 1.0;
        
        if (adminSurgeEnabled) {
          surgeMultiplier = adminSurgeMultiplier;
        } else {
          // Simulate higher demand during rush hours (7-9 AM, 5-7 PM)
          const hour = new Date().getHours();
          const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
          // Random demand factor between 1.0 and 1.5 during rush hour, otherwise 1.0 to 1.1
          surgeMultiplier = isRushHour ? (1.2 + Math.random() * 0.3) : (1.0 + Math.random() * 0.1);
        }

        const pricePadrao = (baseFare + distanceKm * perKm + durationMin * perMin) * surgeMultiplier;
        const priceComfort = pricePadrao * 1.3;

        res.json({
          distance: distanceKm,
          duration: durationMin,
          pricePadrao,
          priceComfort,
          surgeMultiplier,
          routeCoordinates: routeData.geometry.coordinates
        });
      } else {
        res.status(400).json({ error: "No route found" });
      }
    } catch (error) {
      console.error("Error calculating fare:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

