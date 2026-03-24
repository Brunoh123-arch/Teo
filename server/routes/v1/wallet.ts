import express from "express";
import { z } from "zod";
import { db } from "../../lib/firebase";
import { authenticate } from "../../lib/middleware";
import { payment } from "../../lib/mercadopago";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const uid = (req as any).user.uid;
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    
    const transactionsSnapshot = await db.collection("wallet_transactions")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
      
    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      balance: userData?.walletBalance || 0,
      transactions
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

router.post("/add-funds", authenticate, async (req, res) => {
  try {
    const { amount } = z.object({ amount: z.number().min(10) }).parse(req.body);
    const uid = (req as any).user.uid;

    const paymentData = {
      body: {
        transaction_amount: amount,
        description: 'Recarga de Saldo - App de Mobilidade',
        payment_method_id: 'pix',
        payer: {
          email: (req as any).user.email
        },
        metadata: {
          userId: uid
        }
      }
    };

    const result = await payment.create(paymentData);
    
    res.json({
      qrCode: result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      paymentId: result.id
    });
  } catch (error) {
    console.error("Error creating PIX:", error);
    res.status(500).json({ error: "Failed to create PIX" });
  }
});

router.post("/withdraw", authenticate, async (req, res) => {
  try {
    const { amount, pixKey } = z.object({
      amount: z.number().min(10), // Minimo de saque: R$ 10
      pixKey: z.string().min(5)
    }).parse(req.body);
    
    const uid = (req as any).user.uid;
    const userRef = db.collection("users").doc(uid);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error("User not found");
      
      const currentBalance = userDoc.data()?.walletBalance || 0;
      if (currentBalance < amount) {
        throw new Error("Insufficient balance");
      }
      
      // Deduzir saldo
      transaction.update(userRef, {
        walletBalance: currentBalance - amount
      });
      
      // Criar registro de saque (pendente)
      const withdrawalRef = db.collection("withdrawals").doc();
      transaction.set(withdrawalRef, {
        userId: uid,
        userName: userDoc.data()?.name || "Driver",
        amount: amount,
        pixKey: pixKey,
        status: "pending",
        createdAt: new Date()
      });
      
      // Criar transação na carteira
      const transactionRef = db.collection("wallet_transactions").doc();
      transaction.set(transactionRef, {
        userId: uid,
        type: 'debit',
        amount: amount,
        description: `Solicitação de Saque (PIX)`,
        withdrawalId: withdrawalRef.id,
        createdAt: new Date(),
        status: 'pending'
      });
    });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error requesting withdrawal:", error);
    res.status(400).json({ error: error.message || "Failed to request withdrawal" });
  }
});

export default router;
