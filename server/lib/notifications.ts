import { getMessaging } from "firebase-admin/messaging";
import { db } from "../lib/firebase";

const messaging = getMessaging();

export async function sendNotification(uid: string, title: string, body: string, data: any = {}) {
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
