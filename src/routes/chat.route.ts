import express, { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { protect, adminMiddleware } from "../middleware/authorized.middleware";

const router: Router = express.Router();
const controller = new ChatController();


// Get user's own chat + messages (creates chat if first time)
router.get("/my-chat", protect, controller.getMyChat);

// User sends a message (chatId resolved server-side from their userId)
router.post("/my-chat/messages", protect, controller.sendMessage);

// ===================== ADMIN ROUTES =====================
router.get("/", protect, adminMiddleware, controller.getAllChats);

// Admin: open a specific chat and see messages
router.get("/:chatId/messages", protect, adminMiddleware, controller.getChatMessages);

// Admin: reply in a specific chat
router.post("/:chatId/messages", protect, adminMiddleware, controller.sendMessage);

// Mark messages as read (both user and admin)
router.put("/:chatId/read", protect, controller.markAsRead);

export default router;
