import express from "express";
import { z } from "zod";
import { db, messaging } from "../../lib/firebase";
import { authenticate } from "../../lib/middleware";

const router = express.Router();

export default (io: any) => {

// Admin Middleware
const isAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  const userDoc = await db.collection("users").doc(user.uid).get();
  
  if (userDoc.data()?.role !== 'admin' && user.email !== 'gringaviews@gmail.com') {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

router.patch("/users/:id/driver-status", authenticate, isAdmin, async (req, res) => {
  try {
    const adminId = (req as any).user.uid;
    const adminDoc = await db.collection("users").doc(adminId).get();

    const { status, reason } = z.object({ 
      status: z.string(),
      reason: z.string().optional()
    }).parse(req.body);
    const targetUserId = req.params.id;

    const userRef = db.collection("users").doc(targetUserId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userSnap.data();
    const batch = db.batch();
    
    // Update user status
    const updateData: any = { 
      driverStatus: status,
      ...(reason ? { rejectionReason: reason } : {})
    };

    if (status === 'approved' && userData?.driverData) {
      updateData.cnh = userData.driverData.cnh || userData.cnh;
      updateData.vehicle = {
        plate: userData.driverData.vehicle?.plate || userData.driverData.plate || userData.vehicle?.plate,
        model: userData.driverData.vehicle?.model || userData.driverData.model || userData.vehicle?.model,
        color: userData.driverData.vehicle?.color || userData.driverData.color || userData.vehicle?.color,
        year: userData.driverData.vehicle?.year || userData.driverData.year || userData.vehicle?.year,
      };
    }

    batch.update(userRef, updateData);
    
    // Update document status if it exists
    const docRef = db.collection("documents").doc(targetUserId);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      batch.update(docRef, { 
        status,
        ...(reason ? { rejectionReason: reason } : {})
      });
    }

    await batch.commit();
    
    // Audit Log
    await db.collection("audit_logs").add({
      adminId,
      adminName: adminDoc.data()?.name || adminDoc.data()?.email || 'Admin',
      action: status === 'approved' ? 'approve_driver' : 'reject_driver',
      targetUserId,
      details: `Driver status changed to ${status}${reason ? ` - Reason: ${reason}` : ''}`,
      timestamp: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating driver status:", error);
    res.status(400).json({ error: "Invalid status" });
  }
});

router.patch("/users/:id/block", authenticate, isAdmin, async (req, res) => {
  try {
    const adminId = (req as any).user.uid;
    const adminDoc = await db.collection("users").doc(adminId).get();

    const { isBlocked } = z.object({ isBlocked: z.boolean() }).parse(req.body);
    const targetUserId = req.params.id;

    await db.collection("users").doc(targetUserId).update({ isBlocked });
    
    // Audit Log
    await db.collection("audit_logs").add({
      adminId,
      adminName: adminDoc.data()?.name || adminDoc.data()?.email || 'Admin',
      action: isBlocked ? 'block_user' : 'unblock_user',
      targetUserId,
      details: `User ${isBlocked ? 'blocked' : 'unblocked'}`,
      timestamp: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Invalid block status" });
  }
});

router.get("/audit-logs", authenticate, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("audit_logs").orderBy("timestamp", "desc").limit(100).get();
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

router.post("/notifications/send", authenticate, isAdmin, async (req, res) => {
  try {
    const adminId = (req as any).user.uid;
    const adminDoc = await db.collection("users").doc(adminId).get();

    const { title, body, target, targetUserId, imageUrl, actionUrl } = z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      target: z.enum(['all', 'drivers', 'passengers', 'specific']),
      targetUserId: z.string().optional(),
      imageUrl: z.string().url().optional().or(z.literal('')),
      actionUrl: z.string().url().optional().or(z.literal(''))
    }).parse(req.body);

    let recipients: { token: string, name: string }[] = [];
    
    if (target === 'specific' && targetUserId) {
      const doc = await db.collection("users").doc(targetUserId).get();
      const data = doc.data();
      if (data?.fcmToken) recipients.push({ token: data.fcmToken, name: data.name || 'Usuário' });
    } else {
      const snapshot = await db.collection("users").get();
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.fcmToken) {
          if (target === 'drivers' && data.driverStatus !== 'approved') return;
          if (target === 'passengers' && data.driverStatus === 'approved') return;
          recipients.push({ token: data.fcmToken, name: data.name || 'Usuário' });
        }
      });
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: "Nenhum usuário encontrado com token de notificação para este público." });
    }

    let successCount = 0;
    let failureCount = 0;
    
    const hasPersonalization = title.includes('{{name}}') || body.includes('{{name}}');

    if (hasPersonalization) {
      // Envio individual para personalização
      const messages = recipients.map(r => ({
        notification: { 
          title: title.replace(/{{name}}/g, r.name), 
          body: body.replace(/{{name}}/g, r.name),
          ...(imageUrl ? { imageUrl } : {})
        },
        data: {
          ...(actionUrl ? { click_action: 'FLUTTER_NOTIFICATION_CLICK', url: actionUrl } : {})
        },
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'default',
            defaultSound: true,
            defaultVibrateTimings: true,
            defaultLightSettings: true,
            ...(imageUrl ? { imageUrl } : {})
          }
        },
        apns: {
          payload: { aps: { sound: 'default', contentAvailable: true, mutableContent: true } },
          ...(imageUrl ? { fcmOptions: { imageUrl } } : {})
        },
        token: r.token
      }));

      const batchSize = 500;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        const response = await messaging.sendEach(batch);
        successCount += response.successCount;
        failureCount += response.failureCount;
      }
    } else {
      // Envio multicast (mais eficiente para mensagens idênticas)
      const tokens = recipients.map(r => r.token);
      const batchSize = 500;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const tokensBatch = tokens.slice(i, i + batchSize);
        const message: any = {
          notification: { 
            title, 
            body,
            ...(imageUrl ? { imageUrl } : {})
          },
          data: {
            ...(actionUrl ? { click_action: 'FLUTTER_NOTIFICATION_CLICK', url: actionUrl } : {})
          },
          android: {
            priority: 'high' as const,
            notification: {
              sound: 'default',
              channelId: 'default',
              defaultSound: true,
              defaultVibrateTimings: true,
              defaultLightSettings: true,
              ...(imageUrl ? { imageUrl } : {})
            }
          },
          apns: {
            payload: { aps: { sound: 'default', contentAvailable: true, mutableContent: true } },
            ...(imageUrl ? { fcmOptions: { imageUrl } } : {})
          },
          tokens: tokensBatch,
        };
        const response = await messaging.sendEachForMulticast(message);
        successCount += response.successCount;
        failureCount += response.failureCount;
      }
    }

    // Audit Log detalhado
    await db.collection("audit_logs").add({
      adminId,
      adminName: adminDoc.data()?.name || adminDoc.data()?.email || 'Admin',
      action: 'send_notification',
      target,
      details: `Notificação "${title}" enviada para ${target} (${successCount} entregues). Personalizada: ${hasPersonalization}`,
      metadata: {
        title,
        body,
        imageUrl,
        actionUrl,
        successCount,
        failureCount,
        totalTargeted: recipients.length
      },
      timestamp: new Date()
    });

    res.json({ success: true, successCount, failureCount });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

router.get("/documents", authenticate, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("documents").where("status", "==", "pending").get();
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.patch("/pricing", authenticate, isAdmin, async (req, res) => {
  try {
    const { baseFare, perKm, perMin } = z.object({
      baseFare: z.number().positive(),
      perKm: z.number().positive(),
      perMin: z.number().positive(),
    }).parse(req.body);

    await db.collection("settings").doc("pricing").set({
      baseFare,
      perKm,
      perMin,
      updatedAt: new Date(),
      updatedBy: (req as any).user.uid
    }, { merge: true });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Invalid pricing data" });
  }
});

router.get("/pricing", authenticate, isAdmin, async (req, res) => {
  try {
    const pricingDoc = await db.collection("settings").doc("pricing").get();
    if (pricingDoc.exists) {
      res.json(pricingDoc.data());
    } else {
      res.json({ baseFare: 5.0, perKm: 1.5, perMin: 0.3 });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pricing" });
  }
});

// Admin Coupons Management
router.get("/coupons", authenticate, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("coupons").get();
    const coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
});

router.post("/coupons", authenticate, isAdmin, async (req, res) => {
  try {
    const couponData = z.object({
      code: z.string().min(3).toUpperCase(),
      discountType: z.enum(['percentage', 'fixed']),
      discountValue: z.number().positive(),
      usageLimit: z.number().optional(),
      expiryDate: z.string().optional(), // ISO string
      description: z.string().optional()
    }).parse(req.body);

    const { code, expiryDate, ...rest } = couponData;
    
    await db.collection("coupons").doc(code).set({
      ...rest,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      usageCount: 0,
      createdAt: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Invalid coupon data" });
  }
});

router.delete("/coupons/:code", authenticate, isAdmin, async (req, res) => {
  try {
    await db.collection("coupons").doc(req.params.code.toUpperCase()).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete coupon" });
  }
});

// Admin Support Management
router.get("/support/tickets", authenticate, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("support_tickets").orderBy("createdAt", "desc").get();
    const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch support tickets" });
  }
});

router.patch("/support/tickets/:id/status", authenticate, isAdmin, async (req, res) => {
  try {
    const { status } = z.object({ status: z.string() }).parse(req.body);
    await db.collection("support_tickets").doc(req.params.id).update({ 
      status,
      updatedAt: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Invalid status" });
  }
});

router.get("/support/tickets/:id/messages", authenticate, isAdmin, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const snapshot = await db.collection("support_tickets").doc(ticketId).collection("messages")
      .orderBy("createdAt", "asc")
      .get();

    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ticket messages" });
  }
});

router.post("/support/tickets/:id/messages", authenticate, isAdmin, async (req, res) => {
  try {
    const { text } = z.object({ text: z.string().min(1) }).parse(req.body);
    const adminId = (req as any).user.uid;
    const ticketId = req.params.id;

    const messageData = {
      text,
      senderId: adminId,
      createdAt: new Date(),
      isAdmin: true
    };

    const messageRef = await db.collection("support_tickets").doc(ticketId).collection("messages").add(messageData);
    
    await db.collection("support_tickets").doc(ticketId).update({
      updatedAt: new Date(),
      status: "in_progress" // Automatically set to in_progress when admin replies
    });

    const fullMessage = { id: messageRef.id, ...messageData };
    io.to(`support-${ticketId}`).emit("new-support-message", fullMessage);

    res.json(fullMessage);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Admin Withdrawals Management
router.get("/withdrawals", authenticate, isAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("withdrawals").orderBy("createdAt", "desc").get();
    const withdrawals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
});

router.post("/withdrawals/:id/process", authenticate, isAdmin, async (req, res) => {
  try {
    const { action } = z.object({ action: z.enum(['complete', 'reject']) }).parse(req.body);
    const withdrawalId = req.params.id;
    
    const withdrawalRef = db.collection("withdrawals").doc(withdrawalId);
    
    await db.runTransaction(async (transaction) => {
      const withdrawalDoc = await transaction.get(withdrawalRef);
      if (!withdrawalDoc.exists) throw new Error("Withdrawal not found");
      
      const withdrawalData = withdrawalDoc.data()!;
      if (withdrawalData.status !== 'pending') throw new Error("Withdrawal already processed");
      
      if (action === 'complete') {
        transaction.update(withdrawalRef, { 
          status: 'completed',
          processedAt: new Date(),
          processedBy: (req as any).user.uid
        });
      } else {
        // Se rejeitar, devolve o saldo para o motorista
        const userRef = db.collection("users").doc(withdrawalData.userId);
        const userDoc = await transaction.get(userRef);
        const currentBalance = userDoc.data()?.walletBalance || 0;
        
        transaction.update(userRef, { 
          walletBalance: currentBalance + withdrawalData.amount 
        });
        
        transaction.update(withdrawalRef, { 
          status: 'rejected',
          processedAt: new Date(),
          processedBy: (req as any).user.uid
        });

        // Registrar estorno na carteira
        const transactionRef = db.collection("wallet_transactions").doc();
        transaction.set(transactionRef, {
          userId: withdrawalData.userId,
          type: 'credit',
          amount: withdrawalData.amount,
          description: `Estorno de saque rejeitado`,
          createdAt: new Date(),
          status: 'completed'
        });
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

  return router;
};
