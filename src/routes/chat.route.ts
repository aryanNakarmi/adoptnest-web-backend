import express, { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { protect, adminMiddleware } from "../middleware/authorized.middleware";

const router: Router = express.Router();
const controller = new ChatController();

// ===================== USER ROUTES =====================
// User: get or create their chat + messages
router.get("/my-chat", protect, controller.getMyChat);

// User: send a message (chatId resolved server-side)
router.post("/my-chat/messages", protect, controller.sendMessage);

// ===================== ADMIN ROUTES =====================
// Admin: see all conversations (inbox)
router.get("/", protect, adminMiddleware, controller.getAllChats);

// Admin: start a conversation with a specific user
router.post("/start/:userId", protect, adminMiddleware, controller.startChatWithUser);

// Admin: open a specific chat and read messages
router.get("/:chatId/messages", protect, adminMiddleware, controller.getChatMessages);

// Admin: reply in a specific chat
router.post("/:chatId/messages", protect, adminMiddleware, controller.sendMessage);

// Both: mark messages as read
router.put("/:chatId/read", protect, controller.markAsRead);

export default router;
