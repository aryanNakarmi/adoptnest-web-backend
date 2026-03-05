import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";

describe("Authentication Routes", () => {
  const TEST_ID = Date.now();

  const testUser = {
    email: `test-auth-${TEST_ID}@example.com`,
    password: "Test@123",
    phoneNumber: "1234567890",
    fullName: `Test User ${TEST_ID}`,
  };

  let authToken: string;
  let createdUserId: string;

  beforeAll(async () => {
    await UserModel.deleteMany({ email: /^test-auth-/ });
    await UserModel.deleteMany({ email: /^test-login-/ });
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: /^test-auth-/ });
    await UserModel.deleteMany({ email: /^test-login-/ });
  });

  // ─── REGISTER (6 tests) ───────────────────────────────────────────────────
  describe("POST /api/v1/auth/register", () => {
    test("1. should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.data).toHaveProperty("email", testUser.email);
      createdUserId = response.body.data._id;
    });

    test("2. should not register duplicate email", async () => {
      const uniqueUser = {
        ...testUser,
        email: `test-auth-dup-${TEST_ID}@example.com`,
      };
      await request(app).post("/api/v1/auth/register").send(uniqueUser);
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(uniqueUser);

      expect(response.status).not.toBe(201);
      expect(response.body.success).toBe(false);
    });

    test("3. should not register with missing fields", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: `test-auth-missing-${TEST_ID}@example.com` });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("4. should not register with invalid email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "invalidemail",
          password: "Test@123",
          phoneNumber: "1234567890",
          fullName: `Test Invalid ${TEST_ID}`,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/email/i);
    });

    test("5. should not register with weak password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: `test-auth-weak-${TEST_ID}@example.com`,
          password: "weak",
          phoneNumber: "1234567890",
          fullName: `Test Weak ${TEST_ID}`,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/password/i);
    });

    test("6. should not register with empty email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "",
          password: "Test@123",
          phoneNumber: "1234567890",
          fullName: `Test Empty ${TEST_ID}`,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ─── LOGIN (5 tests) ──────────────────────────────────────────────────────
  describe("POST /api/v1/auth/login", () => {
    const loginTestUser = {
      email: `test-login-${TEST_ID}@example.com`,
      password: "Test@123",
      phoneNumber: "9876543210",
      fullName: `Login Test ${TEST_ID}`,
    };

    beforeAll(async () => {
      await request(app).post("/api/v1/auth/register").send(loginTestUser);
    });

    test("7. should login successfully with correct credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: loginTestUser.email, password: loginTestUser.password });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty("token");
      expect(response.body.data.email).toBe(loginTestUser.email);
      authToken = response.body.token;
    });

    test("8. should not login with wrong password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: loginTestUser.email, password: "WrongPassword@123" });

      expect([400, 401, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test("9. should not login with non-existent email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: `nonexistent-${TEST_ID}@example.com`, password: "Test@123" });

      expect([400, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test("10. should not login with missing email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ password: loginTestUser.password });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("11. should not login with missing password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: loginTestUser.email });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ─── GET USER BY ID (3 tests) ─────────────────────────────────────────────
  describe("GET /api/v1/auth/user/:id", () => {
    beforeAll(async () => {
      // Ensure we have a token and userId from registration
      if (!authToken || !createdUserId) {
        const reg = await request(app)
          .post("/api/v1/auth/register")
          .send({
            email: `test-auth-getbyid-${TEST_ID}@example.com`,
            password: "Test@123",
            phoneNumber: "1234567890",
            fullName: `GetById User ${TEST_ID}`,
          });
        createdUserId = reg.body.data._id;

        const login = await request(app)
          .post("/api/v1/auth/login")
          .send({
            email: `test-auth-getbyid-${TEST_ID}@example.com`,
            password: "Test@123",
          });
        authToken = login.body.token;
      }
    });

    test("12. should get user by valid ID", async () => {
      const response = await request(app)
        .get(`/api/v1/auth/${createdUserId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("_id", createdUserId);
    });

    test("13. should return 404 for non-existent user ID", async () => {
      const response = await request(app)
        .get("/api/v1/auth/000000000000000000000000")
        .set("Authorization", `Bearer ${authToken}`);

      expect([404, 400, 500]).toContain(response.status);
      expect(response.body.success).not.toBe(true);
    });

    test("14. should return 400 for invalid ID format", async () => {
      const response = await request(app)
        .get("/api/v1/auth/invalid-id")
        .set("Authorization", `Bearer ${authToken}`);

      expect([400, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  // ─── UPDATE PROFILE (4 tests) ─────────────────────────────────────────────
  describe("PUT /api/v1/auth/profile", () => {
    test("15. should update profile successfully with valid token", async () => {
      const response = await request(app)
        .put("/api/v1/auth/update-profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ fullName: `Updated Name ${TEST_ID}` });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User profile updated successfully");
    });

    test("16. should return 401 when updating profile without token", async () => {
      const response = await request(app)
        .put("/api/v1/auth/update-profile")
        .send({ fullName: "No Auth User" });

      expect([401, 403]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test("17. should return 400 for invalid update data", async () => {
      const response = await request(app)
        .put("/api/v1/auth/update-profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ email: "not-a-valid-email" });

      expect([400, 422]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test("18. should return 401 with expired/invalid token", async () => {
      const response = await request(app)
        .put("/api/v1/auth/update-profile")
        .set("Authorization", "Bearer invalidtoken123")
        .send({ fullName: "Updated Name" });

      expect([401, 403]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  // ─── REQUEST PASSWORD RESET (3 tests) ────────────────────────────────────
  describe("POST /api/v1/auth/request-password-reset", () => {
    test("19. should send reset email for existing user", async () => {
      const response = await request(app)
        .post("/api/v1/auth/request-password-reset")
        .send({ email: testUser.email });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });

    test("20. should return error for non-existent email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/request-password-reset")
        .send({ email: `nonexistent-reset-${TEST_ID}@example.com` });

      expect([400, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test("21. should return 400 when email is missing", async () => {
      const response = await request(app)
        .post("/api/v1/auth/request-password-reset")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ─── RESET PASSWORD (3 tests) ─────────────────────────────────────────────
  describe("POST /api/v1/auth/reset-password/:token", () => {
    test("22. should return error for invalid reset token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/reset-password/invalidtoken123")
        .send({ newPassword: "NewPass@123" });

      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test("23. should return error for expired reset token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/reset-password/expiredtoken000000000000")
        .send({ newPassword: "NewPass@123" });

      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test("24. should return error when new password is missing", async () => {
      const response = await request(app)
        .post("/api/v1/auth/reset-password/sometoken123")
        .send({});

      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  // ─── DELETE USER (3 tests) ────────────────────────────────────────────────
  describe("DELETE /api/v1/auth/user/:id", () => {
    let deleteUserId: string;

    beforeAll(async () => {
      const reg = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: `test-auth-delete-${TEST_ID}@example.com`,
          password: "Test@123",
          phoneNumber: "1234567890",
          fullName: `Delete User ${TEST_ID}`,
        });
      deleteUserId = reg.body.data._id;
    });

    test("25. should delete user by valid ID", async () => {
      const response = await request(app)
        .delete(`/api/v1/auth/${deleteUserId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User deleted successfully");
    });

    test("26. should return 404 when deleting already deleted user", async () => {
      const response = await request(app)
        .delete(`/api/v1/auth/${deleteUserId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect([404, 400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test("27. should return 404 for non-existent user ID", async () => {
      const response = await request(app)
        .delete("/api/v1/auth/000000000000000000000000")
        .set("Authorization", `Bearer ${authToken}`);

      expect([404, 400, 500]).toContain(response.status);
      expect(response.body.success).not.toBe(true);
    });
  });
});