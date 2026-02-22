import { Request, Response } from "express";
import { chatService } from "../services/chat.service";
import { getIO } from "../socket/socket";
import z from "zod";

interface AuthRequest extends Request {
  user?: any;
}

const SendMessageDTO = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters")
    .trim(),
});

export class ChatController {

  // ===================== USER: Get or create their chat =====================
  async getMyChat(req: AuthRequest, res: Response) {
    try {
      const userId = req.user._id.toString();
      const chat = await chatService.getOrCreateChat(userId);
      const messages = await chatService.getMessages(chat._id.toString());

      // Get unread count BEFORE marking as read so sidebar can use it
      const unreadCount = await chatService.getUnreadCount(chat._id.toString(), "user");

      await chatService.markAsRead(chat._id.toString(), "user");

      return res.status(200).json({
        success: true,
        message: "Chat retrieved successfully",
        data: { chat, messages, unreadCount },
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to get chat",
      });
    }
  }

  // ===================== USER or ADMIN: Send a message =====================
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user._id.toString();
      const senderRole = req.user.role === "admin" ? "admin" : "user";

      let chatId = req.params.chatId;

      if (senderRole === "user") {
        const chat = await chatService.getOrCreateChat(userId);
        chatId = chat._id.toString();
      }

      if (!chatId) {
        return res.status(400).json({ success: false, message: "Chat ID is required" });
      }

      const parsed = SendMessageDTO.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsed.error),
        });
      }

      const message = await chatService.sendMessage({
        chatId,
        senderId: userId,
        senderRole,
        content: parsed.data.content,
      });

      const io = getIO();
      io.to(chatId).emit("new_message", message);

      return res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: message,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to send message",
      });
    }
  }

  // ===================== ADMIN: Get all chats (inbox) =====================
  async getAllChats(req: AuthRequest, res: Response) {
    try {
      const chats = await chatService.getAllChats();
      return res.status(200).json({
        success: true,
        message: "All chats retrieved successfully",
        data: chats,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to get chats",
      });
    }
  }

  // ===================== ADMIN: Get messages for a specific chat =====================
  async getChatMessages(req: AuthRequest, res: Response) {
    try {
      const { chatId } = req.params;

      const chat = await chatService.getChatById(chatId);
      if (!chat) {
        return res.status(404).json({ success: false, message: "Chat not found" });
      }

      const messages = await chatService.getMessages(chatId);
      await chatService.markAsRead(chatId, "admin");

      const io = getIO();
      io.to(chatId).emit("messages_read", { chatId, readerRole: "admin" });

      return res.status(200).json({
        success: true,
        message: "Messages retrieved successfully",
        data: { chat, messages },
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to get messages",
      });
    }
  }

  // ===================== ADMIN: Start a conversation with any user =====================
  async startChatWithUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }

      const chat = await chatService.getOrCreateChat(userId);

      return res.status(200).json({
        success: true,
        message: "Chat started successfully",
        data: chat,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to start chat",
      });
    }
  }

  // ===================== Mark messages as read =====================
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { chatId } = req.params;
      const readerRole = req.user.role === "admin" ? "admin" : "user";

      await chatService.markAsRead(chatId, readerRole);

      const io = getIO();
      io.to(chatId).emit("messages_read", { chatId, readerRole });

      return res.status(200).json({
        success: true,
        message: "Messages marked as read",
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to mark messages as read",
      });
    }
  }
}
