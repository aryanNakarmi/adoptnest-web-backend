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

  // Delete ALL test data before tests start
  beforeAll(async () => {
    console.log("Cleaning up all auth test data...");
    await UserModel.deleteMany({ 
      email: /^test-auth-/
    });
    await UserModel.deleteMany({ 
      email: /^test-login-/
    });
    console.log("All auth test data cleaned");
  });

  // Delete ALL test data after tests complete
  afterAll(async () => {
    console.log("Final cleanup of auth test data...");
    await UserModel.deleteMany({ 
      email: /^test-auth-/
    });
    await UserModel.deleteMany({ 
      email: /^test-login-/
    });
    console.log("Auth test data cleaned");
  });

  // REGISTER TESTS (6 tests)
  describe("POST /api/v1/auth/register", () => {

    test("1. should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.data).toHaveProperty("email", testUser.email);
    });

    test("2. should not register duplicate email", async () => {
      const uniqueUser = {
        ...testUser,
        email: `test-auth-dup-${TEST_ID}@example.com`,
      };

      const firstRes = await request(app)
        .post("/api/v1/auth/register")
        .send(uniqueUser);

      expect(firstRes.status).toBe(201);

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(uniqueUser);

      expect(response.status).not.toBe(201);
      expect(response.body.success).toBe(false);
    });

    test("3. should not register with missing fields", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({ 
          email: `test-auth-missing-${TEST_ID}@example.com` 
        });

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

    test("6. should not register with empty required fields", async () => {
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

  // LOGIN TESTS (5 tests)
  describe("POST /api/v1/auth/login", () => {
    const loginTestUser = {
      email: `test-login-${TEST_ID}@example.com`,
      password: "Test@123",
      phoneNumber: "9876543210",
      fullName: `Login Test ${TEST_ID}`,
    };

    beforeAll(async () => {
      await request(app)
        .post("/api/v1/auth/register")
        .send(loginTestUser);
    });

    test("7. should login successfully with correct credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: loginTestUser.email,
          password: loginTestUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty("token");
      expect(response.body.data.email).toBe(loginTestUser.email);
    });

    test("8. should not login with wrong password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: loginTestUser.email,
          password: "WrongPassword@123",
        });

      expect([400, 401, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test("9. should not login with non-existent email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: `nonexistent-${TEST_ID}@example.com`,
          password: "Test@123",
        });

      expect([400, 404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test("10. should not login with missing email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ 
          password: loginTestUser.password 
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test("11. should not login with missing password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ 
          email: loginTestUser.email 
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});