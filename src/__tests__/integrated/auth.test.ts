import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";

describe("Authentication Routes", () => {
  const testUser = {
    email: "test@example.com",
    password: "Test@123",
    phoneNumber: "1234567890",
    fullName: "Test User",
  };

  // Clean database before each test
  beforeEach(async () => {
    await UserModel.deleteMany({ email: testUser.email });
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
  });

  // =========================
  // REGISTER TESTS
  // =========================
  describe("POST /api/v1/auth/register", () => {

    test("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
    });

    test("should not register duplicate email", async () => {
      // First registration
      await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      // Second registration (duplicate)
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      expect(response.status).toBe(409);

      expect(response.body.success).toBe(false);
    });

    test("should not register with missing fields", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "no_password@example.com" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should not register with invalid email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "invalidemail",
          password: "Test@123",
          phoneNumber: "1234567890",
          fullName: "Invalid Email",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/email/i);
    });

    test("should not register with weak password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "weakpass@example.com",
          password: "weak",
          phoneNumber: "1234567890",
          fullName: "Weak Password",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/password/i);
    });
  });

  // =========================
  // LOGIN TESTS
  // =========================
  describe("POST /api/v1/auth/login", () => {

    beforeEach(async () => {
      // Register user before login tests
      await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);
    });

    test("should login successfully with correct credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty("token");
      expect(response.body.data.email).toBe(testUser.email);
    });

    test("should not login with wrong password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword",
        });

      expect([400, 401]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test("should not login with non-existent email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "doesnotexist@example.com",
          password: "Test@123",
        });

      expect([400, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test("should not login with missing email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ password: testUser.password });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should not login with missing password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: testUser.email });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("should not login with invalid data types", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: 12345, password: true });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
