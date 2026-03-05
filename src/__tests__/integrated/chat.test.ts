import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { ChatModel, MessageModel } from "../../models/chat.model";
import mongoose from "mongoose";

// Mock socket.io so controller calls to getIO() don't crash in test environment
jest.mock("../../socket/socket", () => ({
  getIO: () => ({
    to: () => ({ emit: () => {} }),
  }),
}));

const TEST_ID = Date.now();

let adminToken: string;
let userToken: string;
let user2Token: string;
let userId: string;
let chatId: string;

describe("Chat Controller", () => {

  beforeAll(async () => {
    await UserModel.deleteMany({ email: /^test-chat-/ });

    // Create admin
    const admin = await UserModel.create({
      fullName: `test-chat-admin-${TEST_ID}`,
      email: `test-chat-admin-${TEST_ID}@example.com`,
      password: require("bcryptjs").hashSync("Admin@123", 10),
      role: "admin",
    });
    const adminLogin = await request(app).post("/api/v1/auth/login").send({ email: admin.email, password: "Admin@123" });
    adminToken = adminLogin.body.token;

    // Create user 1
    const userRes = await request(app).post("/api/v1/auth/register").send({
      fullName: `test-chat-user-${TEST_ID}`,
      email: `test-chat-user-${TEST_ID}@example.com`,
      password: "User@123",
      phoneNumber: "1234567890",
    });
    userId = userRes.body.data._id;
    const userLogin = await request(app).post("/api/v1/auth/login").send({ email: `test-chat-user-${TEST_ID}@example.com`, password: "User@123" });
    userToken = userLogin.body.token;

    // Create user 2
    await request(app).post("/api/v1/auth/register").send({
      fullName: `test-chat-user2-${TEST_ID}`,
      email: `test-chat-user2-${TEST_ID}@example.com`,
      password: "User@123",
      phoneNumber: "9876543210",
    });
    const user2Login = await request(app).post("/api/v1/auth/login").send({ email: `test-chat-user2-${TEST_ID}@example.com`, password: "User@123" });
    user2Token = user2Login.body.token;
  });

  afterAll(async () => {
    const testUsers = await UserModel.find({ email: /^test-chat-/ });
    const testUserIds = testUsers.map(u => u._id);
    const chats = await ChatModel.find({ userId: { $in: testUserIds } });
    const chatIds = chats.map(c => c._id);
    await MessageModel.deleteMany({ chatId: { $in: chatIds } });
    await ChatModel.deleteMany({ userId: { $in: testUserIds } });
    await UserModel.deleteMany({ email: /^test-chat-/ });
  });

  // GET /api/v1/chats/my-chat
  describe("GET /api/v1/chats/my-chat", () => {
    test("1. user gets their chat (created on first access)", async () => {
      const res = await request(app).get("/api/v1/chats/my-chat").set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("chat");
      expect(res.body.data).toHaveProperty("messages");
      expect(res.body.data).toHaveProperty("unreadCount");
      chatId = res.body.data.chat._id;
    });

    test("2. second call returns same chat (not duplicated)", async () => {
      const res1 = await request(app).get("/api/v1/chats/my-chat").set("Authorization", `Bearer ${userToken}`);
      const res2 = await request(app).get("/api/v1/chats/my-chat").set("Authorization", `Bearer ${userToken}`);
      expect(res1.body.data.chat._id).toBe(res2.body.data.chat._id);
    });

    test("3. unauthenticated request is rejected", async () => {
      const res = await request(app).get("/api/v1/chats/my-chat");
      expect(res.status).toBe(401);
    });
  });

  // POST /api/v1/chats/my-chat/messages (user sends a message)
  describe("POST /api/v1/chats/my-chat/messages", () => {
    test("4. user sends a message successfully", async () => {
      const res = await request(app).post("/api/v1/chats/my-chat/messages").set("Authorization", `Bearer ${userToken}`).send({ content: "Hello admin!" });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe("Hello admin!");
      expect(res.body.data.senderRole).toBe("user");
    });

    test("5. message is persisted in DB", async () => {
      const chat = await ChatModel.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      expect(chat).not.toBeNull();
      const messages = await MessageModel.find({ chatId: chat!._id });
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.some(m => m.content === "Hello admin!")).toBe(true);
    });

    test("6. chat lastMessage is updated after sending", async () => {
      const chat = await ChatModel.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      expect(chat!.lastMessage).toBe("Hello admin!");
    });

    test("7. returns 400 when content is empty", async () => {
      const res = await request(app).post("/api/v1/chats/my-chat/messages").set("Authorization", `Bearer ${userToken}`).send({ content: "" });
      expect(res.status).toBe(400);
    });

    test("8. returns 400 when content exceeds 2000 characters", async () => {
      const res = await request(app).post("/api/v1/chats/my-chat/messages").set("Authorization", `Bearer ${userToken}`).send({ content: "a".repeat(2001) });
      expect(res.status).toBe(400);
    });

    test("9. unauthenticated request is rejected", async () => {
      const res = await request(app).post("/api/v1/chats/my-chat/messages").send({ content: "hi" });
      expect(res.status).toBe(401);
    });
  });

  // GET /api/v1/chats/ (admin gets all chats)
  describe("GET /api/v1/chats/ (admin inbox)", () => {
    test("10. admin gets all chats", async () => {
      const res = await request(app).get("/api/v1/chats/").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.some((c: any) => c._id === chatId)).toBe(true);
    });

    test("11. each chat includes unreadCount", async () => {
      const res = await request(app).get("/api/v1/chats/").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      res.body.data.forEach((c: any) => expect(c).toHaveProperty("unreadCount"));
    });

    test("12. regular user cannot access all chats", async () => {
      const res = await request(app).get("/api/v1/chats/").set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    test("13. unauthenticated request is rejected", async () => {
      const res = await request(app).get("/api/v1/chats/");
      expect(res.status).toBe(401);
    });
  });

  // GET /api/v1/chats/:chatId/messages (admin reads a chat)
  describe("GET /api/v1/chats/:chatId/messages (admin only)", () => {
    test("14. admin gets messages for a specific chat", async () => {
      const res = await request(app).get(`/api/v1/chats/${chatId}/messages`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("messages");
      expect(res.body.data.messages).toBeInstanceOf(Array);
    });

    test("15. returns 404 for non-existent chatId", async () => {
      const res = await request(app).get("/api/v1/chats/000000000000000000000001/messages").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    test("16. regular user cannot access this admin-only route", async () => {
      const res = await request(app).get(`/api/v1/chats/${chatId}/messages`).set("Authorization", `Bearer ${user2Token}`);
      expect(res.status).toBe(403);
    });
  });

  // POST /api/v1/chats/:chatId/messages (admin replies)
  describe("POST /api/v1/chats/:chatId/messages (admin reply)", () => {
    test("17. admin sends a message in a user chat", async () => {
      const res = await request(app).post(`/api/v1/chats/${chatId}/messages`).set("Authorization", `Bearer ${adminToken}`).send({ content: "Hello user, how can I help?" });
      expect(res.status).toBe(201);
      expect(res.body.data.senderRole).toBe("admin");
      expect(res.body.data.content).toBe("Hello user, how can I help?");
    });

    test("18. returns 400 when content is missing", async () => {
      const res = await request(app).post(`/api/v1/chats/${chatId}/messages`).set("Authorization", `Bearer ${adminToken}`).send({});
      expect(res.status).toBe(400);
    });

    test("19. regular user cannot reply via admin route", async () => {
      const res = await request(app).post(`/api/v1/chats/${chatId}/messages`).set("Authorization", `Bearer ${user2Token}`).send({ content: "hi" });
      expect(res.status).toBe(403);
    });
  });

  // POST /api/v1/chats/start/:userId (admin starts chat with user)
  describe("POST /api/v1/chats/start/:userId (admin only)", () => {
    test("20. admin can start a chat with any user", async () => {
      const res = await request(app).post(`/api/v1/chats/start/${userId}`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("_id");
    });

    test("21. starting chat with same user returns existing chat", async () => {
      const res1 = await request(app).post(`/api/v1/chats/start/${userId}`).set("Authorization", `Bearer ${adminToken}`);
      const res2 = await request(app).post(`/api/v1/chats/start/${userId}`).set("Authorization", `Bearer ${adminToken}`);
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data._id).toBe(res2.body.data._id);
    });

    test("22. regular user cannot use this admin-only route", async () => {
      const res = await request(app).post(`/api/v1/chats/start/${userId}`).set("Authorization", `Bearer ${user2Token}`);
      expect(res.status).toBe(403);
    });
  });

  // PUT /api/v1/chats/:chatId/read (mark messages as read)
  describe("PUT /api/v1/chats/:chatId/read", () => {
    test("23. user marks messages as read", async () => {
      const res = await request(app).put(`/api/v1/chats/${chatId}/read`).set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Messages marked as read");
    });

    test("24. admin marks messages as read", async () => {
      const res = await request(app).put(`/api/v1/chats/${chatId}/read`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test("25. unauthenticated request is rejected", async () => {
      const res = await request(app).put(`/api/v1/chats/${chatId}/read`);
      expect(res.status).toBe(401);
    });
  });
});