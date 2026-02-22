import { ChatRepository } from "../repositories/chat.repository";
import { IChat, IMessage } from "../models/chat.model";

const chatRepository = new ChatRepository();

export class ChatService {
  async getOrCreateChat(userId: string): Promise<IChat> {
    return chatRepository.getOrCreateChat(userId);
  }

  async getChatByUserId(userId: string): Promise<IChat | null> {
    return chatRepository.getChatByUserId(userId);
  }

  async getChatById(chatId: string): Promise<IChat | null> {
    return chatRepository.getChatById(chatId);
  }

  async getAllChats(): Promise<IChat[]> {
    return chatRepository.getAllChats();
  }

  async getMessages(chatId: string): Promise<IMessage[]> {
    return chatRepository.getMessages(chatId);
  }

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

  async markAsRead(chatId: string, readerRole: "user" | "admin"): Promise<void> {
    return chatRepository.markMessagesAsRead(chatId, readerRole);
  }

  async getUnreadCount(chatId: string, readerRole: "user" | "admin"): Promise<number> {
    return chatRepository.getUnreadCount(chatId, readerRole);
  }
}

export const chatService = new ChatService();
