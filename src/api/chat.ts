import type { Conversation, Message } from "@/types/chat";
import { Platform } from "react-native";

const BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";

type Page<T> = {
  content: T[]; number: number; size: number;
  totalElements: number; totalPages: number; last: boolean;
};

export async function listConversations(userId: number, page = 0, size = 20) {
  const r = await fetch(`${BASE_URL}/conversations?userId=${userId}&page=${page}&size=${size}`);
  if (!r.ok) throw new Error("Failed to load conversations");
  return (await r.json()) as Page<Conversation>;
}
export async function createConversation(user1Id: number, user2Id: number, listingId: number) {
  const r = await fetch(`${BASE_URL}/conversations`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user1Id, user2Id, listingId }),
  });
  if (!r.ok) throw new Error("Failed to create conversation");
  return (await r.json()) as Conversation;
}
export async function listMessages(conversationId: number, page = 0, size = 20) {
  const r = await fetch(`${BASE_URL}/conversations/${conversationId}/messages?page=${page}&size=${size}`);
  if (!r.ok) throw new Error("Failed to load messages");
  return (await r.json()) as Page<Message>;
}
export async function sendMessage(conversationId: number, senderId: number, receiverId: number, content: string) {
  const r = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId, receiverId, content }),
  });
  if (!r.ok) throw new Error("Failed to send message");
  return (await r.json()) as Message;
}
export async function markRead(conversationId: number, messageId: number, read: boolean) {
  const path = read ? "read" : "unread";
  const r = await fetch(`${BASE_URL}/conversations/${conversationId}/messages/${messageId}/${path}`, { method: "PATCH" });
  if (!r.ok) throw new Error("Failed to update read state");
  return (await r.json()) as Message;
}
