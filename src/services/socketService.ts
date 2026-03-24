import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private connectCallbacks: (() => void)[] = [];

  connect() {
    if (this.socket) return;
    
    // In production, the socket server is on the same host/port as the app
    this.socket = io();

    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      this.connectCallbacks.forEach(cb => cb());
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });
  }

  onConnect(callback: () => void) {
    this.connectCallbacks.push(callback);
    if (this.socket?.connected) {
      callback();
    }
  }

  offConnect(callback: () => void) {
    this.connectCallbacks = this.connectCallbacks.filter(cb => cb !== callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRide(rideId: string) {
    this.socket?.emit("join-ride", rideId);
  }

  joinSupportTicket(ticketId: string) {
    this.socket?.emit("join-support", ticketId);
  }

  joinDrivers() {
    this.socket?.emit("join-drivers");
  }

  updateLocation(data: { uid: string; lat: number; lng: number; rideId?: string | null }) {
    this.socket?.emit("update-location", data);
  }

  onRideUpdated(callback: (data: any) => void) {
    this.socket?.on("ride-updated", callback);
  }

  onNewRideAvailable(callback: (data: any) => void) {
    this.socket?.on("new-ride-available", callback);
  }

  onDriverLocationUpdated(callback: (data: any) => void) {
    this.socket?.on("driver-location-updated", callback);
  }

  onDriverMoved(callback: (data: any) => void) {
    this.socket?.on("driver-moved", callback);
  }

  onNewMessage(callback: (data: any) => void) {
    this.socket?.on("new-message", callback);
  }

  onNewSupportMessage(callback: (data: any) => void) {
    this.socket?.on("new-support-message", callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }
}

export const socketService = new SocketService();
