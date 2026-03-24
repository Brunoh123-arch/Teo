import { API_BASE, getAuthHeaders } from "./rideService";

export const userService = {
  updateDriverStatus: async (userId: string, status: string, reason?: string) => {
    const response = await fetch(`${API_BASE}/api/v1/admin/users/${userId}/driver-status`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status, reason }),
    });
    if (!response.ok) throw new Error("Failed to update driver status");
    return response.json();
  },

  updateUserBlockStatus: async (userId: string, isBlocked: boolean) => {
    const response = await fetch(`${API_BASE}/api/v1/admin/users/${userId}/block`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ isBlocked }),
    });
    if (!response.ok) throw new Error("Failed to update block status");
    return response.json();
  },

  syncUser: async (name: string | null, email: string | null) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/sync`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ name, email }),
    });
    if (!response.ok) throw new Error("Failed to sync user");
    return response.json();
  },

  updateVehicle: async (vehicleData: any) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/vehicle`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify(vehicleData),
    });
    if (!response.ok) throw new Error("Failed to update vehicle");
    return response.json();
  },

  updateDriverData: async (driverData: any) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/driver-data`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ driverData }),
    });
    if (!response.ok) throw new Error("Failed to update driver data");
    return response.json();
  },

  toggleOnlineStatus: async (isOnline: boolean) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/online-status`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ isOnline }),
    });
    if (!response.ok) throw new Error("Failed to toggle online status");
    return response.json();
  },

  updateLocation: async (lat: number, lng: number, activeRideId?: string | null) => {
    const response = await fetch(`${API_BASE}/api/v1/drivers/location`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ lat, lng, activeRideId }),
    });
    if (!response.ok) throw new Error("Failed to update location");
    return response.json();
  },

  deleteAccount: async () => {
    const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete account");
    return response.json();
  },

  getSavedPlaces: async () => {
    const response = await fetch(`${API_BASE}/api/v1/users/saved-places`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch saved places");
    return response.json();
  },

  getPendingDocuments: async () => {
    const response = await fetch(`${API_BASE}/api/v1/admin/documents`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch pending documents");
    return response.json();
  },

  getWallet: async () => {
    const response = await fetch(`${API_BASE}/api/v1/wallet`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch wallet");
    return response.json();
  },

  addFunds: async (amount: number) => {
    const response = await fetch(`${API_BASE}/api/v1/wallet/add-funds`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) throw new Error("Failed to add funds");
    return response.json();
  },

  withdraw: async (amount: number, pixKey: string) => {
    const response = await fetch(`${API_BASE}/api/v1/wallet/withdraw`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ amount, pixKey }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to withdraw");
    }
    return response.json();
  },

  updateFcmToken: async (fcmToken: string) => {
    const response = await fetch(`${API_BASE}/api/v1/auth/fcm-token`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ token: fcmToken }),
    });
    if (!response.ok) throw new Error("Failed to update FCM token");
    return response.json();
  },

  getPricingSettings: async () => {
    const response = await fetch(`${API_BASE}/api/v1/admin/pricing`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch pricing settings");
    return response.json();
  },

  updatePricingSettings: async (data: { baseFare: number, perKm: number, perMin: number, surgeEnabled?: boolean, surgeMultiplier?: number }) => {
    const response = await fetch(`${API_BASE}/api/v1/admin/pricing`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update pricing settings");
    return response.json();
  },

  getAuditLogs: async () => {
    const response = await fetch(`${API_BASE}/api/v1/admin/audit-logs`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch audit logs");
    return response.json();
  },

  sendNotification: async (data: { title: string, body: string, target: string, targetUserId?: string, imageUrl?: string, actionUrl?: string }) => {
    const response = await fetch(`${API_BASE}/api/v1/admin/notifications/send`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to send notification");
    }
    return response.json();
  },

  saveNotificationTemplate: async (template: { name: string, title: string, body: string, imageUrl?: string, actionUrl?: string }) => {
    const { addDoc, collection } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    return addDoc(collection(db, 'notification_templates'), {
      ...template,
      createdAt: new Date().toISOString()
    });
  },

  deleteNotificationTemplate: async (templateId: string) => {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    return deleteDoc(doc(db, 'notification_templates', templateId));
  },

  // Admin Coupons
  getCoupons: async () => {
    const response = await fetch(`${API_BASE}/api/v1/admin/coupons`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch coupons");
    return response.json();
  },

  createCoupon: async (couponData: any) => {
    const response = await fetch(`${API_BASE}/api/v1/admin/coupons`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(couponData),
    });
    if (!response.ok) throw new Error("Failed to create coupon");
    return response.json();
  },

  deleteCoupon: async (code: string) => {
    const response = await fetch(`${API_BASE}/api/v1/admin/coupons/${code}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete coupon");
    return response.json();
  },

  // Admin Support
  getAllSupportTickets: async () => {
    const response = await fetch(`${API_BASE}/api/v1/admin/support/tickets`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch support tickets");
    return response.json();
  },

  updateSupportTicketStatus: async (ticketId: string, status: string) => {
    const response = await fetch(`${API_BASE}/api/v1/admin/support/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error("Failed to update ticket status");
    return response.json();
  },

  // Admin Withdrawals
  getWithdrawals: async () => {
    const response = await fetch(`${API_BASE}/api/v1/admin/withdrawals`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch withdrawals");
    return response.json();
  },

  processWithdrawal: async (id: string, action: string) => {
    const response = await fetch(`${API_BASE}/api/v1/admin/withdrawals/${id}/process`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to process withdrawal");
    }
    return response.json();
  },
 
  uploadDocument: async (type: string, url: string) => {
    const response = await fetch(`${API_BASE}/api/v1/users/documents`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ type, url }),
    });
    if (!response.ok) throw new Error("Failed to upload document");
    return response.json();
  },

  getDriverEarnings: async () => {
    const response = await fetch(`${API_BASE}/api/v1/drivers/earnings`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch driver earnings");
    return response.json();
  },

  getReferralInfo: async () => {
    const response = await fetch(`${API_BASE}/api/v1/users/referral`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch referral info");
    return response.json();
  },

  applyReferralCode: async (code: string) => {
    const response = await fetch(`${API_BASE}/api/v1/users/referral/apply`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ code }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Código de indicação inválido");
    }
    return response.json();
  },

  acceptTerms: async () => {
    const response = await fetch(`${API_BASE}/api/v1/auth/accept-terms`, {
      method: "POST",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to accept terms");
    return response.json();
  }
};
