import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment'; // Ensure WebSocket URL is in `environment.ts`

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket;
  private readonly WS_URL = "http://localhost:4000"; // ✅ WebSocket Server URL

  constructor() {
    this.socket = io(this.WS_URL, {
      reconnection: true,        // ✅ Auto-reconnect on disconnect
      reconnectionAttempts: 10,  // ✅ Retry up to 10 times
      transports: ["websocket"]  // ✅ Use WebSocket only (avoid HTTP polling)
    });

    // ✅ Handle Connection Errors
    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    // ✅ Handle Reconnection Events
    this.socket.on("reconnect_attempt", (attempt) => {
      console.warn(`Reconnection attempt ${attempt}...`);
    });

    this.socket.on("reconnect", () => {
      console.log("Reconnected to WebSocket server.");
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("WebSocket disconnected:", reason);
    });
  }

  // ✅ Join Meeting (With Meeting ID & User ID)
  joinMeeting(meetingId: string, userId: string) {
    if (this.socket.connected) {
      this.socket.emit("joinMeeting", { meetingId, userId }, (response: any) => {
        console.log("Join Meeting Response:", response);
      });
    } else {
      console.warn("Socket not connected. Retrying...");
      this.socket.connect(); // Attempt to reconnect
    }
  }

  // ✅ Leave Meeting Room
  leaveMeeting(meetingId: string, userId: string) {
    if (this.socket.connected) {
      this.socket.emit("leaveMeeting", { meetingId, userId }, (response: any) => {
        console.log("Leave Meeting Response:", response);
      });
    }
  }

  // ✅ Listen for Meeting Updates (Avoiding Duplicate Listeners)
  onMeetingUpdates(callback: (data: any) => void) {
    this.socket.off("meetingUpdate"); // Remove existing listener to prevent duplicates
    this.socket.on("meetingUpdate", callback);
  }

  // ✅ Handle WebSocket Disconnection
  onDisconnect(callback: () => void) {
    this.socket.off("disconnect"); // Remove previous listener
    this.socket.on("disconnect", (reason) => {
      console.warn("WebSocket disconnected:", reason);
      callback();
    });
  }

  sendVote(vote: any) {
    this.socket.emit("vote", vote);
  }

  onVoteUpdate(callback: (vote: any) => void) {
    this.socket.on("voteUpdate", callback);
  }

  // ✅ Clean Disconnect (Used when closing the app)
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log("WebSocket connection closed.");
    }
  }

}
