export type Conversation = {
  id: number;
  user1Id: number;
  user2Id: number;
  listingId: number | null;
  lastMessageAt: string | null;
  createdAt: string | null;
};

export type Message = {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  listingId: number | null;
};
