import { auth } from "../firebase";

export const API_BASE = ""; // Assuming relative paths work in the same origin

export async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const token = await user.getIdToken();
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export const rideService = {
  createRide: async (rideData: any) => {
    const response = await fetch(`${API_BASE}/api/v1/rides`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(rideData),
    });
    if (!response.ok) throw new Error("Failed to create ride");
    return response.json();
  },

  getRide: async (rideId: string) => {
    const response = await fetch(`${API_BASE}/api/v1/rides/${rideId}`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch ride");
    return response.json();
  },

  getActiveRide: async (mode: "rider" | "driver") => {
    const response = await fetch(`${API_BASE}/api/v1/rides/active?mode=${mode}`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch active ride");
    return response.json();
  },

  getAvailableRides: async () => {
    const response = await fetch(`${API_BASE}/api/v1/rides/available`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch available rides");
    return response.json();
  },

  acceptRide: async (rideId: string) => {
    const response = await fetch(`${API_BASE}/api/v1/rides/${rideId}/accept`, {
      method: "POST",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to accept ride");
    return response.json();
  },

  cancelRide: async (rideId: string, reason: string) => {
    const response = await fetch(`${API_BASE}/api/v1/rides/${rideId}/cancel`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error("Failed to cancel ride");
    return response.json();
  },

  updateRideStatus: async (rideId: string, status: string) => {
    const response = await fetch(`${API_BASE}/api/v1/rides/${rideId}/status`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error("Failed to update ride status");
    return response.json();
  },

  rateRide: async (rideId: string, rating: number, tip: number = 0, comment: string = "") => {
    const response = await fetch(`${API_BASE}/api/v1/rides/${rideId}/rate`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ rating, tip, comment }),
    });
    if (!response.ok) throw new Error("Failed to rate ride");
    return response.json();
  },

  getRideHistory: async (mode: "rider" | "driver" = "rider") => {
    const response = await fetch(`${API_BASE}/api/v1/rides/history?mode=${mode}`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch history");
    return response.json();
  },

  getEarnings: async () => {
    const response = await fetch(`${API_BASE}/api/v1/drivers/earnings`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch earnings");
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

  requestWithdrawal: async (amount: number, pixKey: string) => {
    const response = await fetch(`${API_BASE}/api/v1/wallet/withdraw`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ amount, pixKey }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to request withdrawal");
    }
    return response.json();
  },

  sendMessage: async (rideId: string, text: string) => {
    const response = await fetch(`${API_BASE}/api/v1/rides/${rideId}/messages`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error("Failed to send message");
    return response.json();
  },

  savePlace: async (placeData: any) => {
    const response = await fetch(`${API_BASE}/api/v1/users/saved-places`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(placeData),
    });
    if (!response.ok) throw new Error("Failed to save place");
    return response.json();
  },

  validateCoupon: async (code: string) => {
    const response = await fetch(`${API_BASE}/api/v1/coupons/validate`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ code }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Cupom inválido");
    }
    return response.json();
  },

  applyCoupon: async (code: string) => {
    const response = await fetch(`${API_BASE}/api/v1/coupons/apply`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ code }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Erro ao aplicar cupom");
    }
    return response.json();
  },

  createSupportTicket: async (ticketData: any) => {
    const response = await fetch(`${API_BASE}/api/v1/support/tickets`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(ticketData),
    });
    if (!response.ok) throw new Error("Failed to create support ticket");
    return response.json();
  },

  getSupportTickets: async () => {
    const response = await fetch(`${API_BASE}/api/v1/support/tickets`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch support tickets");
    return response.json();
  },

  getSupportTicketMessages: async (ticketId: string) => {
    const response = await fetch(`${API_BASE}/api/v1/support/tickets/${ticketId}/messages`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch ticket messages");
    return response.json();
  },

  sendSupportTicketMessage: async (ticketId: string, text: string) => {
    const response = await fetch(`${API_BASE}/api/v1/support/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error("Failed to send message");
    return response.json();
  },

  getAdminSupportTicketMessages: async (ticketId: string) => {
    const response = await fetch(`${API_BASE}/api/v1/admin/support/tickets/${ticketId}/messages`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch ticket messages");
    return response.json();
  },

  sendAdminSupportTicketMessage: async (ticketId: string, text: string) => {
    const response = await fetch(`${API_BASE}/api/v1/admin/support/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error("Failed to send message");
    return response.json();
  },

  getNearbyDrivers: async () => {
    const response = await fetch(`${API_BASE}/api/v1/drivers/nearby`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch nearby drivers");
    return response.json();
  },
 
  calculateFare: async (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    const response = await fetch(`${API_BASE}/api/v1/rides/calculate-fare`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ origin, destination }),
    });
    if (!response.ok) throw new Error("Failed to calculate fare");
    return response.json();
  },

  updateUserProfile: async (userData: any) => {
    const response = await fetch(`${API_BASE}/api/v1/users/profile`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error("Failed to update profile");
    return response.json();
  }
};
