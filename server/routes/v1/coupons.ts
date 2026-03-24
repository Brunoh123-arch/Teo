import express from "express";
import { getFirestore } from "firebase-admin/firestore";
import { z } from "zod";

const router = express.Router();
const db = getFirestore();

// Middleware para verificar token de autenticação (assumindo que já existe no server.ts, mas aqui repetimos para isolamento se necessário ou passamos via parâmetro)
const authenticate = async (req: any, res: any, next: any) => {
  if (req.user) return next();
  res.status(401).json({ error: "Unauthorized" });
};

router.post("/validate", async (req, res) => {
  try {
    const { code } = z.object({ code: z.string().min(1) }).parse(req.body);
    const uid = (req as any).user.uid;

    const couponDoc = await db.collection("coupons").doc(code.toUpperCase()).get();

    if (!couponDoc.exists) {
      return res.status(404).json({ error: "Cupom inválido" });
    }

    const couponData = couponDoc.data()!;
    const now = new Date();

    if (couponData.expiryDate && couponData.expiryDate.toDate() < now) {
      return res.status(400).json({ error: "Cupom expirado" });
    }

    if (couponData.usageLimit && couponData.usageCount >= couponData.usageLimit) {
      return res.status(400).json({ error: "Limite de uso do cupom atingido" });
    }

    // Verificar se o usuário já usou este cupom
    const userUsageDoc = await db.collection("coupons").doc(code.toUpperCase())
      .collection("users").doc(uid).get();

    if (userUsageDoc.exists) {
      return res.status(400).json({ error: "Você já utilizou este cupom" });
    }

    res.json({
      success: true,
      discountType: couponData.discountType, // 'percentage' or 'fixed'
      discountValue: couponData.discountValue,
      description: couponData.description
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ error: "Erro ao validar cupom" });
  }
});

export default router;
