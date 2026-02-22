import { Request, Response } from "express";
import { chatService } from "../services/chat.service";
import { SendMessageDTO } from "../dtos/chat.dto";
import z from "zod";
import { getIO } from "../socket/socket";

interface AuthRequest extends Request {
  user?: any;
}

export class ChatController {
  // ===================== USER: Get or create their chat =====================
  async getMyChat(req: AuthRequest, res: Response) {
    try {
      const userId = req.user._id.toString();
      const chat = await chatService.getOrCreateChat(userId);
      const messages = await chatService.getMessages(chat._id.toString());

      // Mark admin messages as read when user opens chat
      await chatService.markAsRead(chat._id.toString(), "user");

      return res.status(200).json({
        success: true,
        message: "Chat retrieved successfully",
        data: { chat, messages },
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Failed to get chat",
      });
    }
  }

  // ===================== USER: Send a message =====================
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user._id.toString();
      const senderRole = req.user.role === "admin" ? "admin" : "user";

      // Get chatId — user sends to their own chat, admin sends to any chat
      let chatId = req.params.chatId;

      // If user (not admin), get or create their chat
      if (senderRole === "user") {
        const chat = await chatService.getOrCreateChat(userId);
        chatId = chat._id.toString();
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

      // Emit to socket room so other party gets it in real-time
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

      // Mark user messages as read when admin opens chat
      await chatService.markAsRead(chatId, "admin");

      // Notify user via socket that their messages were read
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
