import request from "supertest";
import { UserModel } from "../../models/user.model";
import { AnimalReportModel } from "../../models/animalreport.model";
import app from "../../app";

describe("Animal Report Integration Tests - 18 Tests", () => {
  // Unique test identifier
  const TEST_ID = Date.now();

  let userToken: string;
  let adminToken: string;
  let reportId: string;
  let userId: string;
  let adminId: string;

  const testUser = {
    fullName: `Report Test User ${TEST_ID}`,
    email: `report-test-user-${TEST_ID}@example.com`,
    password: "Test@123",
    phoneNumber: "1234567890",
  };

  const testAdmin = {
    fullName: `Report Test Admin ${TEST_ID}`,
    email: `report-test-admin-${TEST_ID}@example.com`,
    password: "Admin@123",
    phoneNumber: "9876543210",
  };

  // ================= SETUP =================
  beforeAll(async () => {
    console.log(" Cleaning up old test data...");
    await UserModel.deleteMany({ 
      email: new RegExp(`report-test-.*-${TEST_ID}`) 
    });
    await AnimalReportModel.deleteMany({ 
      location: new RegExp(`test-location-${TEST_ID}`) 
    });
    console.log("Old test data cleaned\n");

    // Register user
    const userRes = await request(app).post("/api/v1/auth/register").send(testUser);
    userId = userRes.body.data._id;

    const loginUser = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    userToken = loginUser.body.token;

    // Register admin
    const adminRes = await request(app).post("/api/v1/auth/register").send(testAdmin);
    adminId = adminRes.body.data._id;

    await UserModel.findByIdAndUpdate(adminId, { role: "admin" });

    const loginAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testAdmin.email, password: testAdmin.password });
    adminToken = loginAdmin.body.token;
  });

  afterAll(async () => {
    // Clean up test data after tests complete
    console.log("Cleaning up test data...");
    await UserModel.deleteMany({ 
      email: new RegExp(`report-test-.*-${TEST_ID}`) 
    });
    await AnimalReportModel.deleteMany({ 
      location: new RegExp(`test-location-${TEST_ID}`) 
    });
    console.log("Test data cleaned\n");
  });

  // ================= CREATE REPORT TESTS =================
  describe("Create Report Tests", () => {
    test("1. should create report with valid data", async () => {
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          species: "Dog",
          location: `test-location-${TEST_ID}-kathmandu`,
          description: "Stray dog spotted near market",
          imageUrl: "/animal_reports/test-dog.jpg",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("species", "Dog");
      reportId = res.body.data._id;
    });

    test("2. should fail create report without authentication", async () => {
      const res = await request(app).post("/api/v1/reports").send({
        species: "Cat",
        location: `test-location-${TEST_ID}-bhaktapur`,
        imageUrl: "/animal_reports/test-cat.jpg",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test("3. should fail create report with missing required fields", async () => {
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          location: `test-location-${TEST_ID}-lalitpur`,
          imageUrl: "/animal_reports/test.jpg",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("4. should create report with optional description missing", async () => {
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          species: "Bird",
          location: `test-location-${TEST_ID}-pokhara`,
          imageUrl: "/animal_reports/test-bird.jpg",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ================= GET REPORTS TESTS =================
  describe("Get Reports Tests", () => {
    test("5. should get all reports as admin", async () => {
      const res = await request(app)
        .get("/api/v1/reports/all?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test("6. should not get all reports as regular user", async () => {
      const res = await request(app)
        .get("/api/v1/reports/all?page=1&limit=10")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("7. should get report by valid ID", async () => {
      const res = await request(app)
        .get(`/api/v1/reports/${reportId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(reportId);
    });

    test("8. should get user's own reports", async () => {
      const res = await request(app)
        .get("/api/v1/reports/my-reports?page=1&limit=10")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test("9. should not get reports without authentication", async () => {
      const res = await request(app)
        .get("/api/v1/reports/my-reports?page=1&limit=10");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ================= UPDATE REPORT STATUS TESTS =================
  describe("Update Report Status Tests", () => {
    let statusTestReportId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          species: "Rabbit",
          location: `test-location-${TEST_ID}-status-test`,
          imageUrl: "/animal_reports/rabbit.jpg",
        });
      statusTestReportId = res.body.data._id;
    });

    test("10. should approve report as admin", async () => {
      const res = await request(app)
        .put(`/api/v1/reports/${statusTestReportId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "approved" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("approved");
    });

    test("11. should fail update status with invalid status value", async () => {
      const res = await request(app)
        .put(`/api/v1/reports/${statusTestReportId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "invalid-status" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("12. should not allow regular user to update status", async () => {
      const res = await request(app)
        .put(`/api/v1/reports/${statusTestReportId}/status`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ status: "approved" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("13. should fail update status without authentication", async () => {
      const res = await request(app)
        .put(`/api/v1/reports/${statusTestReportId}/status`)
        .send({ status: "approved" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ================= DELETE REPORT TESTS=================
  describe("Delete Report Tests", () => {
    test("14. should delete own report as owner", async () => {
      const createRes = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          species: "Snake",
          location: `test-location-${TEST_ID}-delete-own`,
          imageUrl: "/animal_reports/snake.jpg",
        });
      const deleteReportId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/v1/reports/${deleteReportId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test("15. should delete any report as admin", async () => {
      const createRes = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          species: "Hamster",
          location: `test-location-${TEST_ID}-admin-delete`,
          imageUrl: "/animal_reports/hamster.jpg",
        });
      const adminDeleteReportId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/v1/reports/${adminDeleteReportId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test("16. should not delete report of another user", async () => {
      const anotherUserRes = await request(app).post("/api/v1/auth/register").send({
        fullName: `Another User ${TEST_ID}`,
        email: `report-test-another-${TEST_ID}@example.com`,
        password: "Another@123",
        phoneNumber: "5555555555",
      });

      const anotherUserLoginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ 
          email: `report-test-another-${TEST_ID}@example.com`, 
          password: "Another@123" 
        });
      const anotherUserToken = anotherUserLoginRes.body.token;

      const createRes = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          species: "Parrot",
          location: `test-location-${TEST_ID}-unauthorized-delete`,
          imageUrl: "/animal_reports/parrot.jpg",
        });
      const protectedReportId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/v1/reports/${protectedReportId}`)
        .set("Authorization", `Bearer ${anotherUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Clean up another user
      await UserModel.deleteMany({ 
        email: new RegExp(`report-test-another-${TEST_ID}`) 
      });
    });

    test("17. should not delete report without authentication", async () => {
      const res = await request(app)
        .delete(`/api/v1/reports/${reportId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ================= FILTER BY SPECIES TESTS =================
  describe("Filter By Species Tests", () => {
    test("18. should filter reports by species", async () => {
      const res = await request(app)
        .get("/api/v1/reports/species/Dog")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});