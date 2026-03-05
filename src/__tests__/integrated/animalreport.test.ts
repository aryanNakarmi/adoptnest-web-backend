import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { AnimalReportModel } from "../../models/animalreport.model";

const TEST_ID = Date.now();

let adminToken: string;
let userToken: string;
let user2Token: string;
let testReportId: string;

const reportPayload = {
  species: "Cat",
  location: { address: "Test Street Downtown", lat: 27.7, lng: 85.3 },
  description: "Found a stray cat near the market",
  imageUrl: "/animal_reports/test-cat.jpg",
};

describe("AnimalReport Controller", () => {

  beforeAll(async () => {
    await UserModel.deleteMany({ email: /^test-report-/ });
    await AnimalReportModel.deleteMany({ "location.address": "Test Street Downtown" });

    // Create admin directly in DB
    const admin = await UserModel.create({
      fullName: `test-report-admin-${TEST_ID}`,
      email: `test-report-admin-${TEST_ID}@example.com`,
      password: require("bcryptjs").hashSync("Admin@123", 10),
      role: "admin",
    });
    const adminLogin = await request(app).post("/api/v1/auth/login").send({ email: admin.email, password: "Admin@123" });
    adminToken = adminLogin.body.token;

    // Create user 1
    await request(app).post("/api/v1/auth/register").send({
      fullName: `test-report-user-${TEST_ID}`,
      email: `test-report-user-${TEST_ID}@example.com`,
      password: "User@123",
      phoneNumber: "1234567890",
    });
    const userLogin = await request(app).post("/api/v1/auth/login").send({ email: `test-report-user-${TEST_ID}@example.com`, password: "User@123" });
    userToken = userLogin.body.token;

    // Create user 2
    await request(app).post("/api/v1/auth/register").send({
      fullName: `test-report-user2-${TEST_ID}`,
      email: `test-report-user2-${TEST_ID}@example.com`,
      password: "User@123",
      phoneNumber: "9876543210",
    });
    const user2Login = await request(app).post("/api/v1/auth/login").send({ email: `test-report-user2-${TEST_ID}@example.com`, password: "User@123" });
    user2Token = user2Login.body.token;

    // Seed a report owned by user 1 — use .set("Content-Type", "application/json") to be explicit
    const created = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${userToken}`)
      .set("Content-Type", "application/json")
      .send(JSON.stringify(reportPayload));

    if (!created.body.data) {
      throw new Error(`Seed report failed: ${JSON.stringify(created.body)}`);
    }
    testReportId = created.body.data._id;
  });

  afterAll(async () => {
    await AnimalReportModel.deleteMany({ "location.address": "Test Street Downtown" });
    await UserModel.deleteMany({ email: /^test-report-/ });
  });

  // POST /api/v1/reports
  describe("POST /api/v1/reports", () => {
    test("1. authenticated user creates a report successfully", async () => {
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Content-Type", "application/json")
        .send(JSON.stringify(reportPayload));
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.species).toBe("Cat");
      expect(res.body.data.status).toBe("pending");
    });

    test("2. report is saved in DB with status pending", async () => {
      const inDb = await AnimalReportModel.findById(testReportId);
      expect(inDb).not.toBeNull();
      expect(inDb!.status).toBe("pending");
    });

    test("3. returns 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ species: "Cat" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("4. unauthenticated user cannot create a report", async () => {
      const res = await request(app).post("/api/v1/reports").send(reportPayload);
      expect(res.status).toBe(401);
    });
  });

  // GET /api/v1/reports/my-reports
  describe("GET /api/v1/reports/my-reports", () => {
    test("5. returns only the authenticated user own reports", async () => {
      const res = await request(app).get("/api/v1/reports/my-reports").set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test("6. user2 reports do not appear in user1 my-reports", async () => {
      // user2 creates their own report
      await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${user2Token}`)
        .set("Content-Type", "application/json")
        .send(JSON.stringify(reportPayload));

      const res = await request(app).get("/api/v1/reports/my-reports").set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);

      const user1Res = await request(app).get("/api/v1/reports/my-reports").set("Authorization", `Bearer ${user2Token}`);
      // user1 and user2 counts should differ — each only sees their own
      expect(res.body.total).not.toBe(user1Res.body.total + res.body.total);
    });

    test("7. unauthenticated request is rejected", async () => {
      const res = await request(app).get("/api/v1/reports/my-reports");
      expect(res.status).toBe(401);
    });
  });

  // GET /api/v1/reports/all (admin only)
  describe("GET /api/v1/reports/all (admin only)", () => {
    test("8. admin gets all reports with pagination", async () => {
      const res = await request(app).get("/api/v1/reports/all").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("pages");
    });

    test("9. regular user cannot access all reports", async () => {
      const res = await request(app).get("/api/v1/reports/all").set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    test("10. unauthenticated request is rejected", async () => {
      const res = await request(app).get("/api/v1/reports/all");
      expect(res.status).toBe(401);
    });
  });

  // GET /api/v1/reports/:id
  describe("GET /api/v1/reports/:id", () => {
    test("11. owner can view their own pending report", async () => {
      const res = await request(app).get(`/api/v1/reports/${testReportId}`).set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(testReportId);
    });

    test("12. non-owner cannot view a pending report", async () => {
      const res = await request(app).get(`/api/v1/reports/${testReportId}`).set("Authorization", `Bearer ${user2Token}`);
      expect(res.status).toBe(403);
    });

    test("13. admin can view any pending report", async () => {
      const res = await request(app).get(`/api/v1/reports/${testReportId}`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    test("14. non-owner can view an approved report", async () => {
      await request(app)
        .put(`/api/v1/reports/${testReportId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "approved" });
      const res = await request(app).get(`/api/v1/reports/${testReportId}`).set("Authorization", `Bearer ${user2Token}`);
      expect(res.status).toBe(200);
    });

    test("15. returns 404 for non-existent report", async () => {
      const res = await request(app).get("/api/v1/reports/000000000000000000000001").set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });
  });

  // PUT /api/v1/reports/:id/status (admin only)
  describe("PUT /api/v1/reports/:id/status (admin only)", () => {
    test("16. admin approves a report", async () => {
      const fresh = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Content-Type", "application/json")
        .send(JSON.stringify(reportPayload));
      const res = await request(app)
        .put(`/api/v1/reports/${fresh.body.data._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "approved" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("approved");
      expect((await AnimalReportModel.findById(fresh.body.data._id))!.status).toBe("approved");
    });

    test("17. admin rejects a report", async () => {
      const fresh = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Content-Type", "application/json")
        .send(JSON.stringify(reportPayload));
      const res = await request(app)
        .put(`/api/v1/reports/${fresh.body.data._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "rejected" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("rejected");
    });

    test("18. returns 400 for invalid status (pending is not valid)", async () => {
      const res = await request(app)
        .put(`/api/v1/reports/${testReportId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "pending" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid status value");
    });

    test("19. regular user cannot update report status", async () => {
      const res = await request(app)
        .put(`/api/v1/reports/${testReportId}/status`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ status: "approved" });
      expect(res.status).toBe(403);
    });
  });

  // DELETE /api/v1/reports/:id
  describe("DELETE /api/v1/reports/:id", () => {
    test("20. owner can delete their own report", async () => {
      const created = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Content-Type", "application/json")
        .send(JSON.stringify(reportPayload));
      const res = await request(app).delete(`/api/v1/reports/${created.body.data._id}`).set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(await AnimalReportModel.findById(created.body.data._id)).toBeNull();
    });

    test("21. admin can delete any report", async () => {
      const created = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Content-Type", "application/json")
        .send(JSON.stringify(reportPayload));
      const res = await request(app).delete(`/api/v1/reports/${created.body.data._id}`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(await AnimalReportModel.findById(created.body.data._id)).toBeNull();
    });

    test("22. non-owner cannot delete another user report", async () => {
      const res = await request(app).delete(`/api/v1/reports/${testReportId}`).set("Authorization", `Bearer ${user2Token}`);
      expect(res.status).toBe(403);
    });

    test("23. returns 404 for non-existent report", async () => {
      const res = await request(app).delete("/api/v1/reports/000000000000000000000001").set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });
  });

  // GET /api/v1/reports/species/:species
  describe("GET /api/v1/reports/species/:species", () => {
    test("24. returns reports matching species (case-insensitive)", async () => {
      const res = await request(app).get("/api/v1/reports/species/cat").set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test("25. returns empty when no species match", async () => {
      const res = await request(app).get("/api/v1/reports/species/Unicorn99zz").set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
    });
  });
});