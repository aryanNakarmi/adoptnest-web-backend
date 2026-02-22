import { ChatModel, IChat, MessageModel, IMessage } from "../models/chat.model";

export interface IChatRepository {
  getOrCreateChat(userId: string): Promise<IChat>;
  getChatByUserId(userId: string): Promise<IChat | null>;
  getChatById(chatId: string): Promise<IChat | null>;
  getAllChats(): Promise<IChat[]>;
  updateLastMessage(chatId: string, content: string): Promise<void>;
  getMessages(chatId: string): Promise<IMessage[]>;
  createMessage(data: {
    chatId: string;
    senderId: string;
    senderRole: "user" | "admin";
    content: string;
  }): Promise<IMessage>;
  markMessagesAsRead(chatId: string, readerRole: "user" | "admin"): Promise<void>;
  getUnreadCount(chatId: string, readerRole: "user" | "admin"): Promise<number>;
}

export class ChatRepository implements IChatRepository {
  async getOrCreateChat(userId: string): Promise<IChat> {
    let chat = await ChatModel.findOne({ userId }).populate("userId", "fullName email profilePicture");
    if (!chat) {
      chat = await ChatModel.create({ userId });
      chat = await ChatModel.findById(chat._id).populate("userId", "fullName email profilePicture") as IChat;
    }
    return chat!;
  }

  async getChatByUserId(userId: string): Promise<IChat | null> {
    return ChatModel.findOne({ userId }).populate("userId", "fullName email profilePicture");
  }

  async getChatById(chatId: string): Promise<IChat | null> {
    return ChatModel.findById(chatId).populate("userId", "fullName email profilePicture");
  }

  async getAllChats(): Promise<IChat[]> {
    return ChatModel.find()
      .populate("userId", "fullName email profilePicture")
      .sort({ lastMessageAt: -1, createdAt: -1 });
  }

  async updateLastMessage(chatId: string, content: string): Promise<void> {
    await ChatModel.findByIdAndUpdate(chatId, {
      lastMessage: content,
      lastMessageAt: new Date(),
    });
  }

  async getMessages(chatId: string): Promise<IMessage[]> {
    return MessageModel.find({ chatId })
      .populate("senderId", "fullName email role profilePicture")
      .sort({ createdAt: 1 });
  }

  async createMessage(data: {
    chatId: string;
    senderId: string;
    senderRole: "user" | "admin";
    content: string;
  }): Promise<IMessage> {
    const message = await MessageModel.create(data);
    return message.populate("senderId", "fullName email role profilePicture");
  }

  async markMessagesAsRead(chatId: string, readerRole: "user" | "admin"): Promise<void> {
    const senderRole = readerRole === "user" ? "admin" : "user";
    await MessageModel.updateMany(
      { chatId, senderRole, isRead: false },
      { isRead: true }
    );
  }

  async getUnreadCount(chatId: string, readerRole: "user" | "admin"): Promise<number> {
    const senderRole = readerRole === "user" ? "admin" : "user";
    return MessageModel.countDocuments({ chatId, senderRole, isRead: false });
  }
}
