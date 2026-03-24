import express from "express";
import { getFirestore } from "firebase-admin/firestore";
import { z } from "zod";

const router = express.Router();
const db = getFirestore();

export default (io: any) => {
  const router = express.Router();

  router.post("/tickets", async (req, res) => {
    try {
      const { subject, message, category } = z.object({
        subject: z.string().min(3),
        message: z.string().min(10),
        category: z.enum(["ride", "payment", "account", "other"])
      }).parse(req.body);

      const uid = (req as any).user.uid;

      const ticketRef = await db.collection("support_tickets").add({
        userId: uid,
        subject,
        message,
        category,
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.json({ id: ticketRef.id, success: true });
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ error: "Erro ao criar ticket de suporte" });
    }
  });

  router.get("/tickets", async (req, res) => {
    try {
      const uid = (req as any).user.uid;
      const snapshot = await db.collection("support_tickets")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc")
        .get();

      const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ error: "Erro ao buscar tickets de suporte" });
    }
  });

  router.get("/tickets/:id/messages", async (req, res) => {
    try {
      const uid = (req as any).user.uid;
      const ticketId = req.params.id;
      
      const ticketDoc = await db.collection("support_tickets").doc(ticketId).get();
      if (!ticketDoc.exists || ticketDoc.data()?.userId !== uid) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const snapshot = await db.collection("support_tickets").doc(ticketId).collection("messages")
        .orderBy("createdAt", "asc")
        .get();

      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(messages);
    } catch (error) {
      console.error("Error fetching ticket messages:", error);
      res.status(500).json({ error: "Erro ao buscar mensagens do ticket" });
    }
  });

  router.post("/tickets/:id/messages", async (req, res) => {
    try {
      const { text } = z.object({ text: z.string().min(1) }).parse(req.body);
      const uid = (req as any).user.uid;
      const ticketId = req.params.id;

      const ticketDoc = await db.collection("support_tickets").doc(ticketId).get();
      if (!ticketDoc.exists || ticketDoc.data()?.userId !== uid) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const messageData = {
        text,
        senderId: uid,
        createdAt: new Date()
      };

      const messageRef = await db.collection("support_tickets").doc(ticketId).collection("messages").add(messageData);
      
      await db.collection("support_tickets").doc(ticketId).update({
        updatedAt: new Date()
      });

      const fullMessage = { id: messageRef.id, ...messageData };
      io.to(`support-${ticketId}`).emit("new-support-message", fullMessage);

      res.json(fullMessage);
    } catch (error) {
      console.error("Error sending ticket message:", error);
      res.status(500).json({ error: "Erro ao enviar mensagem" });
    }
  });

  return router;
};
