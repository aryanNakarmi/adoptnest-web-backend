import { ChatRepository } from "../repositories/chat.repository";
import { IChat, IMessage } from "../models/chat.model";

const chatRepository = new ChatRepository();

export class ChatService {
  // User opens their chat with admin — creates if doesn't exist
  async getOrCreateChat(userId: string): Promise<IChat> {
    return chatRepository.getOrCreateChat(userId);
  }

  // Get chat by user ID (for user to find their own chat)
  async getChatByUserId(userId: string): Promise<IChat | null> {
    return chatRepository.getChatByUserId(userId);
  }

  // Get chat by chat ID (for admin)
  async getChatById(chatId: string): Promise<IChat | null> {
    return chatRepository.getChatById(chatId);
  }

  // Admin: get all chats (inbox)
  async getAllChats(): Promise<IChat[]> {
    return chatRepository.getAllChats();
  }

  // Get messages for a chat
  async getMessages(chatId: string): Promise<IMessage[]> {
    return chatRepository.getMessages(chatId);
  }

  // Send a message
  async sendMessage(data: {
    chatId: string;
    senderId: string;
    senderRole: "user" | "admin";
    content: string;
  }): Promise<IMessage> {
    const message = await chatRepository.createMessage(data);
    await chatRepository.updateLastMessage(data.chatId, data.content);
    return message;
  }

  // Mark messages as read
  async markAsRead(chatId: string, readerRole: "user" | "admin"): Promise<void> {
    return chatRepository.markMessagesAsRead(chatId, readerRole);
  }

  // Get unread count
  async getUnreadCount(chatId: string, readerRole: "user" | "admin"): Promise<number> {
    return chatRepository.getUnreadCount(chatId, readerRole);
  }
}

export const chatService = new ChatService();
