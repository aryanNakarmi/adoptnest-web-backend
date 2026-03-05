import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";

const TEST_ID = Date.now();

const adminUser = {
  fullName: `Test Admin ${TEST_ID}`,
  email: `test-admin-${TEST_ID}@example.com`,
  password: "Admin@123",
  phoneNumber: "1111111111",
};

const regularUser = {
  fullName: `Test Regular ${TEST_ID}`,
  email: `test-admin-user-${TEST_ID}@example.com`,
  password: "User@123",
  phoneNumber: "2222222222",
};

let adminToken: string;
let adminId: string;
let regularToken: string;
let regularUserId: string;

describe("Admin Controller", () => {

  beforeAll(async () => {
    // Clean leftover test data
    await UserModel.deleteMany({ email: /^test-admin-/ });

    // Create admin directly in DB
    const admin = await UserModel.create({
      fullName: adminUser.fullName,
      email: adminUser.email,
      password: require("bcryptjs").hashSync(adminUser.password, 10),
      phoneNumber: adminUser.phoneNumber,
      role: "admin",
    });
    adminId = admin._id.toString();

    const adminLogin = await request(app).post("/api/v1/auth/login").send({ email: adminUser.email, password: adminUser.password });
    adminToken = adminLogin.body.token;

    // Create regular user via register
    const regRes = await request(app).post("/api/v1/auth/register").send(regularUser);
    regularUserId = regRes.body.data._id;
    const userLogin = await request(app).post("/api/v1/auth/login").send({ email: regularUser.email, password: regularUser.password });
    regularToken = userLogin.body.token;
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: /^test-admin-/ });
  });

  // GET /api/v1/admin/users
  describe("GET /api/v1/admin/users", () => {
    test("1. admin gets all users with pagination", async () => {
      const res = await request(app).get("/api/v1/admin/users").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination).toHaveProperty("total");
      expect(res.body.pagination).toHaveProperty("totalPages");
    });

    test("2. admin can search users by name", async () => {
      const res = await request(app).get(`/api/v1/admin/users?search=Test Admin ${TEST_ID}`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.some((u: any) => u.email === adminUser.email)).toBe(true);
    });

    test("3. admin can paginate users", async () => {
      const res = await request(app).get("/api/v1/admin/users?page=1&size=5").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.size).toBe(5);
    });

    test("4. should reject unauthenticated request", async () => {
      const res = await request(app).get("/api/v1/admin/users");
      expect(res.status).toBe(401);
    });

    test("5. should reject regular user (not admin)", async () => {
      const res = await request(app).get("/api/v1/admin/users").set("Authorization", `Bearer ${regularToken}`);
      expect(res.status).toBe(403);
    });

    test("6. response data should not include password", async () => {
      const res = await request(app).get("/api/v1/admin/users").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      res.body.data.forEach((u: any) => expect(u).not.toHaveProperty("password"));
    });
  });

  // GET /api/v1/admin/users/:id
  describe("GET /api/v1/admin/users/:id", () => {
    test("7. admin gets user by id", async () => {
      const res = await request(app).get(`/api/v1/admin/users/${regularUserId}`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(regularUser.email);
    });

    test("8. returns 404 for non-existent user id", async () => {
      const fakeId = "000000000000000000000001";
      const res = await request(app).get(`/api/v1/admin/users/${fakeId}`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    test("9. regular user cannot access this route", async () => {
      const res = await request(app).get(`/api/v1/admin/users/${regularUserId}`).set("Authorization", `Bearer ${regularToken}`);
      expect(res.status).toBe(403);
    });
  });

  // PUT /api/v1/admin/users/:id
  describe("PUT /api/v1/admin/users/:id", () => {
    test("10. admin updates user fullName", async () => {
      const res = await request(app).put(`/api/v1/admin/users/${regularUserId}`).set("Authorization", `Bearer ${adminToken}`).send({ fullName: `Updated ${TEST_ID}` });
      expect(res.status).toBe(200);
      expect(res.body.data.fullName).toBe(`Updated ${TEST_ID}`);
    });

    test("11. admin can promote user to admin role", async () => {
      const res = await request(app).put(`/api/v1/admin/users/${regularUserId}`).set("Authorization", `Bearer ${adminToken}`).send({ role: "admin" });
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("admin");
      // Restore role
      await request(app).put(`/api/v1/admin/users/${regularUserId}`).set("Authorization", `Bearer ${adminToken}`).send({ role: "user" });
    });

    test("12. returns 400 when no update fields provided", async () => {
      const res = await request(app).put(`/api/v1/admin/users/${regularUserId}`).set("Authorization", `Bearer ${adminToken}`).send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("No fields to update");
    });

    test("13. returns 409 when updating to an already-taken email", async () => {
      const res = await request(app).put(`/api/v1/admin/users/${regularUserId}`).set("Authorization", `Bearer ${adminToken}`).send({ email: adminUser.email });
      expect(res.status).toBe(409);
    });

    test("14. regular user cannot update via admin route", async () => {
      const res = await request(app).put(`/api/v1/admin/users/${regularUserId}`).set("Authorization", `Bearer ${regularToken}`).send({ fullName: "Hacked" });
      expect(res.status).toBe(403);
    });
  });

  // DELETE /api/v1/admin/users/:id
  describe("DELETE /api/v1/admin/users/:id", () => {
    test("15. admin deletes a user", async () => {
      // Create a disposable user to delete
      const toDelete = await UserModel.create({
        fullName: `test-admin-delete-${TEST_ID}`,
        email: `test-admin-delete-${TEST_ID}@example.com`,
        password: "x",
        role: "user",
      });
      const res = await request(app).delete(`/api/v1/admin/users/${toDelete._id}`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(await UserModel.findById(toDelete._id)).toBeNull();
    });

    test("16. returns 404 when deleting non-existent user", async () => {
      const fakeId = "000000000000000000000001";
      const res = await request(app).delete(`/api/v1/admin/users/${fakeId}`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    test("17. regular user cannot delete via admin route", async () => {
      const res = await request(app).delete(`/api/v1/admin/users/${regularUserId}`).set("Authorization", `Bearer ${regularToken}`);
      expect(res.status).toBe(403);
    });

    test("18. unauthenticated request is rejected", async () => {
      const res = await request(app).delete(`/api/v1/admin/users/${regularUserId}`);
      expect(res.status).toBe(401);
    });
  });

  // POST /api/v1/admin/users
  describe("POST /api/v1/admin/users", () => {
    test("19. admin creates a new user", async () => {
      const newUser = { fullName: `test-admin-created-${TEST_ID}`, email: `test-admin-created-${TEST_ID}@example.com`, password: "Test@123", phoneNumber: "9999999999" };
      const res = await request(app).post("/api/v1/admin/users").set("Authorization", `Bearer ${adminToken}`).send(newUser);
      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe(newUser.email);
      expect(await UserModel.findOne({ email: newUser.email })).not.toBeNull();
    });

    test("20. regular user cannot create users via admin route", async () => {
      const res = await request(app).post("/api/v1/admin/users").set("Authorization", `Bearer ${regularToken}`).send({ fullName: "x", email: "x@test.com", password: "Test@123" });
      expect(res.status).toBe(403);
    });
  });
});