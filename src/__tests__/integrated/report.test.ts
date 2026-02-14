import request from "supertest";
import { UserModel } from "../../models/user.model";
import { AnimalReportModel } from "../../models/animalreport.model";
import app from "../../app";

describe("Animal Report Integration Tests", () => {
  let userToken: string;
  let adminToken: string;
  let reportId: string;

  const testUser = {
    fullName: "Test User",
    email: "user@test.com",
    password: "Test@123",
    phoneNumber: "1234567890",
  };

  const testAdmin = {
    fullName: "Admin User",
    email: "admin@test.com",
    password: "Admin@123",
    phoneNumber: "9876543210",
  };

  // ================= SETUP =================
  beforeAll(async () => {
    await UserModel.deleteMany({});
    await AnimalReportModel.deleteMany({});

    // create normal user
    await request(app).post("/api/v1/auth/register").send(testUser);

    const loginUser = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    userToken = loginUser.body.token;

    // create admin
    const adminRes = await request(app).post("/api/v1/auth/register").send(testAdmin);

    // Update role to admin
    await UserModel.findByIdAndUpdate(adminRes.body.data._id, { role: "admin" });

    const loginAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testAdmin.email, password: testAdmin.password });

    adminToken = loginAdmin.body.token;
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await AnimalReportModel.deleteMany({});
  });

  // ================= CREATE REPORT =================

  test("User should create report", async () => {
    const res = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        species: "Dog",
        location: "Kathmandu",
        description: "Stray dog spotted",
        imageUrl: "/animal_reports/test.jpg",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    reportId = res.body.data._id;
  });

  test("Should fail without token", async () => {
    const res = await request(app).post("/api/v1/reports").send({
      species: "Cat",
      location: "Bhaktapur",
      description: "Lost cat",
      imageUrl: "/animal_reports/cat.jpg",
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("Should fail with invalid body", async () => {
    const res = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ================= GET ALL REPORTS =================

  test("Admin should get all reports", async () => {
    const res = await request(app)
      .get("/api/v1/reports/all?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("User should not access all reports", async () => {
    const res = await request(app)
      .get("/api/v1/reports/all?page=1&limit=10")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // ================= GET REPORT BY ID =================

  test("Owner should fetch own report", async () => {
    const res = await request(app)
      .get(`/api/v1/reports/${reportId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("Other user should not access pending report", async () => {
    const newUser = {
      fullName: "Another User",
      email: "another@test.com",
      password: "Another@123",
      phoneNumber: "5555555555",
    };

    await request(app).post("/api/v1/auth/register").send(newUser);

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: newUser.email, password: newUser.password });

    const otherToken = login.body.token;

    const res = await request(app)
      .get(`/api/v1/reports/${reportId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // ================= UPDATE STATUS =================

  test("Admin should approve report", async () => {
    const res = await request(app)
      .put(`/api/v1/reports/${reportId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "approved" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("approved");
  });

  test("User should not update report status", async () => {
    const res = await request(app)
      .put(`/api/v1/reports/${reportId}/status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ status: "rejected" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("Invalid status should fail", async () => {
    const res = await request(app)
      .put(`/api/v1/reports/${reportId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "invalid" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ================= DELETE REPORT =================

  test("Owner should delete report", async () => {
    const create = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        species: "Cat",
        location: "Lalitpur",
        description: "Another report",
        imageUrl: "/animal_reports/test2.jpg",
      });

    const id = create.body.data._id;

    const res = await request(app)
      .delete(`/api/v1/reports/${id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("Admin can delete any report", async () => {
    const create = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        species: "Bird",
        location: "Pokhara",
        description: "Bird sighting",
        imageUrl: "/animal_reports/bird.jpg",
      });

    const id = create.body.data._id;

    const res = await request(app)
      .delete(`/api/v1/reports/${id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("Should return 404 for non-existing report", async () => {
    const fakeId = "64b5f1f1f1f1f1f1f1f1f1f1";

    const res = await request(app)
      .delete(`/api/v1/reports/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // ================= FILTER BY SPECIES =================

  test("Should filter reports by species", async () => {
    const res = await request(app)
      .get("/api/v1/reports/species/Dog")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ================= GET MY REPORTS =================

  test("User should get their own reports", async () => {
    const res = await request(app)
      .get("/api/v1/reports/my-reports?page=1&limit=10")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("Should fail to get reports without token", async () => {
    const res = await request(app)
      .get("/api/v1/reports/my-reports?page=1&limit=10");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ================= EDGE CASES =================

  test("Should not create report without authentication", async () => {
    const res = await request(app)
      .post("/api/v1/reports")
      .send({
        species: "Dog",
        location: "Kathmandu",
        description: "Test dog",
        imageUrl: "/animal_reports/test.jpg",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("Should not create report with empty species", async () => {
    const res = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        species: "",
        location: "Kathmandu",
        description: "Test dog",
        imageUrl: "/animal_reports/test.jpg",
      });

    expect(res.status).not.toBe(201);
    expect(res.body.success).toBe(false);
  });

  test("Should not get report with invalid ID format", async () => {
    const res = await request(app)
      .get("/api/v1/reports/invalid-id")
      .set("Authorization", `Bearer ${userToken}`);

    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});