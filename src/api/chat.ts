// src/api/chat.ts
import type { Conversation, Message } from "@/types/chat";

const BASE_URL = "https://hood-deals-3827cb9a0599.herokuapp.com";
const BASIC_AUTH = "Basic " + btoa("user:password");

type Page<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

// 🔹 List conversations for a user
export async function listConversations(
  userId: number,
  page = 0,
  size = 20
): Promise<Page<Conversation>> {
  const url = `${BASE_URL}/conversations?userId=${userId}&page=${page}&size=${size}`;
  console.log("listConversations →", url);

  const r = await fetch(url, {
    headers: {
      Authorization: BASIC_AUTH,
      "Content-Type": "application/json",
    },
  });

  if (!r.ok) {
    const text = await r.text();
    console.log("listConversations error body:", text);
    throw new Error(`Failed to load conversations: ${r.status}`);
  }

  return r.json();
}

// 🔹 Create a conversation (if you need it)
export async function createConversation(
  user1Id: number,
  user2Id: number,
  listingId: number
): Promise<Conversation> {
  const url = `${BASE_URL}/conversations`;
  console.log("createConversation →", url);

  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: BASIC_AUTH,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user1Id, user2Id, listingId }),
  });

  if (!r.ok) {
    const text = await r.text();
    console.log("createConversation error body:", text);
    throw new Error(`Failed to create conversation: ${r.status}`);
  }

  return r.json();
}

// 🔹 List messages in a conversation
export async function listMessages(
  conversationId: number,
  page = 0,
  size = 20
): Promise<Page<Message>> {
  const url = `${BASE_URL}/conversations/${conversationId}/messages?page=${page}&size=${size}`;
  console.log("listMessages →", url);

  const r = await fetch(url, {
    headers: {
      Authorization: BASIC_AUTH,
      "Content-Type": "application/json",
    },
  });

  if (!r.ok) {
    const text = await r.text();
    console.log("listMessages error body:", text);
    throw new Error(`Failed to load messages: ${r.status}`);
  }

  return r.json();
}

// 🔹 Send a new message
export async function sendMessage(
  conversationId: number,
  senderId: number,
  receiverId: number,
  content: string
): Promise<Message> {
  const url = `${BASE_URL}/conversations/${conversationId}/messages`;
  console.log("sendMessage →", url, { conversationId, senderId, receiverId, content });

  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: BASIC_AUTH,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ senderId, receiverId, content }),
  });

  if (!r.ok) {
    const text = await r.text();
    console.log("sendMessage error body:", text);
    throw new Error(`Failed to send message: ${r.status}`);
  }

  return r.json();
}

// 🔹 Mark read / unread (if your backend supports it)
export async function markRead(
  conversationId: number,
  messageId: number,
  read: boolean
): Promise<Message> {
  const path = read ? "read" : "unread";
  const url = `${BASE_URL}/conversations/${conversationId}/messages/${messageId}/${path}`;
  console.log("markRead →", url);

  const r = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: BASIC_AUTH,
      "Content-Type": "application/json",
    },
  });

  if (!r.ok) {
    const text = await r.text();
    console.log("markRead error body:", text);
    throw new Error(`Failed to update read state: ${r.status}`);
  }

  return r.json();
}
