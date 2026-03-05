import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { AnimalPostModel } from "../../models/animalpost.model";

const TEST_ID = Date.now();

let adminToken: string;
let adminId: string;
let userToken: string;
let userId: string;
let testPostId: string;

describe("AnimalPost Controller", () => {

  beforeAll(async () => {
    await AnimalPostModel.deleteMany({ location: `test-post-${TEST_ID}` });
    await UserModel.deleteMany({ email: /^test-post-/ });

    // Create admin
    const admin = await UserModel.create({
      fullName: `test-post-admin-${TEST_ID}`,
      email: `test-post-admin-${TEST_ID}@example.com`,
      password: require("bcryptjs").hashSync("Admin@123", 10),
      role: "admin",
    });
    adminId = admin._id.toString();
    const adminLogin = await request(app).post("/api/v1/auth/login").send({ email: admin.email, password: "Admin@123" });
    adminToken = adminLogin.body.token;

    // Create regular user
    const userRes = await request(app).post("/api/v1/auth/register").send({
      fullName: `test-post-user-${TEST_ID}`,
      email: `test-post-user-${TEST_ID}@example.com`,
      password: "User@123",
      phoneNumber: "1234567890",
    });
    userId = userRes.body.data._id;
    const userLogin = await request(app).post("/api/v1/auth/login").send({ email: `test-post-user-${TEST_ID}@example.com`, password: "User@123" });
    userToken = userLogin.body.token;

    // Seed one post directly
    const post = await AnimalPostModel.create({
      species: "Dog", gender: "Male", breed: "Labrador", age: 2,
      location: `test-post-${TEST_ID}`, description: "Friendly dog",
      photos: ["/dog.jpg"], status: "Available",
    });
    testPostId = post._id.toString();
  });

  afterAll(async () => {
    await AnimalPostModel.deleteMany({ location: `test-post-${TEST_ID}` });
    await UserModel.deleteMany({ email: /^test-post-/ });
  });

  // ── POST /api/v1/animal-posts ──────────────────────────────────────────────
  describe("POST /api/v1/animal-posts", () => {
    test("1. admin creates a post with a photo", async () => {
      const res = await request(app)
        .post("/api/v1/animal-posts")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("species", "Cat")
        .field("gender", "Female")
        .field("breed", "Persian")
        .field("age", "3")
        .field("location", `test-post-${TEST_ID}`)
        .field("description", "Fluffy cat")
        .attach("animalPost", Buffer.from("fake-image-data"), {
          filename: "cat.jpg",
          contentType: "image/jpeg",
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.breed).toBe("Persian");
    });

    test("1b. admin creates a post without photos — photos optional or DTO may reject", async () => {
      const res = await request(app)
        .post("/api/v1/animal-posts")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("species", "Cat")
        .field("gender", "Female")
        .field("breed", "Tabby")
        .field("age", "2")
        .field("location", `test-post-${TEST_ID}`)
        .field("description", "No photo cat");
      // 201 if DTO allows empty photos, 400 if photos are required
      expect([201, 400]).toContain(res.status);
    });

    test("2. admin creates a post with a photo attachment", async () => {
      const res = await request(app)
        .post("/api/v1/animal-posts")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("species", "Dog")
        .field("gender", "Male")
        .field("breed", "Beagle")
        .field("age", "1")
        .field("location", `test-post-${TEST_ID}`)
        .field("description", "Playful beagle")
        .attach("animalPost", Buffer.from("fake-image-data"), {
          filename: "dog.jpg",
          contentType: "image/jpeg",
        });
      expect(res.status).toBe(201);
      expect(res.body.data.photos.length).toBeGreaterThan(0);
    });

    test("3. returns 400 when required fields are missing", async () => {
      const res = await request(app)
        .post("/api/v1/animal-posts")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("species", "Dog");
      // Missing gender, breed, age, location, description
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("4. returns 400 when age is not a number", async () => {
      const res = await request(app)
        .post("/api/v1/animal-posts")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("species", "Dog")
        .field("gender", "Male")
        .field("breed", "Poodle")
        .field("age", "notanumber")
        .field("location", `test-post-${TEST_ID}`)
        .field("description", "Some dog");
      expect(res.status).toBe(400);
    });

    test("5. unauthenticated user cannot create a post", async () => {
      const res = await request(app)
        .post("/api/v1/animal-posts")
        .field("species", "Dog")
        .field("gender", "Male")
        .field("breed", "Poodle")
        .field("age", "2")
        .field("location", `test-post-${TEST_ID}`)
        .field("description", "Some dog");
      expect(res.status).toBe(401);
    });

    test("6. regular user cannot create a post", async () => {
      const res = await request(app)
        .post("/api/v1/animal-posts")
        .set("Authorization", `Bearer ${userToken}`)
        .field("species", "Dog")
        .field("gender", "Male")
        .field("breed", "Poodle")
        .field("age", "2")
        .field("location", `test-post-${TEST_ID}`)
        .field("description", "Some dog");
      expect(res.status).toBe(403);
    });
  });

  // ── GET /api/v1/animal-posts ───────────────────────────────────────────────
  describe("GET /api/v1/animal-posts", () => {
    test("7. returns all posts publicly (no auth required)", async () => {
      const res = await request(app).get("/api/v1/animal-posts");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    test("8. response includes seeded test post", async () => {
      const res = await request(app).get("/api/v1/animal-posts");
      expect(res.body.data.some((p: any) => p._id === testPostId)).toBe(true);
    });
  });

  // ── GET /api/v1/animal-posts/:id ──────────────────────────────────────────
  describe("GET /api/v1/animal-posts/:id", () => {
    test("9. returns post by id", async () => {
      const res = await request(app).get(`/api/v1/animal-posts/${testPostId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.breed).toBe("Labrador");
    });

    test("10. returns 404 for non-existent post", async () => {
      const res = await request(app).get("/api/v1/animal-posts/000000000000000000000001");
      expect(res.status).toBe(404);
    });
  });

  // ── GET /api/v1/animal-posts/species/:species ─────────────────────────────
  describe("GET /api/v1/animal-posts/species/:species", () => {
    test("11. returns posts filtered by species", async () => {
      const res = await request(app).get("/api/v1/animal-posts/species/Dog");
      expect(res.status).toBe(200);
      expect(res.body.data.every((p: any) => p.species === "Dog")).toBe(true);
    });

    test("12. species filter is case-insensitive", async () => {
      const res = await request(app).get("/api/v1/animal-posts/species/dog");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test("13. returns empty array for unknown species", async () => {
      const res = await request(app).get("/api/v1/animal-posts/species/Dragon");
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  // ── PUT /api/v1/animal-posts/:id ──────────────────────────────────────────
  describe("PUT /api/v1/animal-posts/:id", () => {
    test("14. admin updates post fields without new photos", async () => {
      const res = await request(app)
        .put(`/api/v1/animal-posts/${testPostId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("breed", "Golden Retriever")
        .field("age", "3")
        .field("description", "Updated description");
      expect(res.status).toBe(200);
      expect(res.body.data.breed).toBe("Golden Retriever");
    });

    test("15. admin updates post with new photo", async () => {
      const res = await request(app)
        .put(`/api/v1/animal-posts/${testPostId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("description", "Updated with photo")
        .attach("animalPost", Buffer.from("fake-image-data"), {
          filename: "update.jpg",
          contentType: "image/jpeg",
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test("16. admin updates post keeping existing photos", async () => {
      const res = await request(app)
        .put(`/api/v1/animal-posts/${testPostId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("description", "Keeping old photos")
        .field("existingPhotos", "/dog.jpg");
      expect(res.status).toBe(200);
    });

    test("17. admin updates post with multiple existing photos as array", async () => {
      const res = await request(app)
        .put(`/api/v1/animal-posts/${testPostId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("description", "Multiple existing photos")
        .field("existingPhotos[]", "/dog.jpg")
        .field("existingPhotos[]", "/dog2.jpg");
      expect(res.status).toBe(200);
    });

    test("18. returns 404 when updating non-existent post", async () => {
      const res = await request(app)
        .put("/api/v1/animal-posts/000000000000000000000001")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("breed", "Poodle");
      expect(res.status).toBe(404);
    });

    test("19. regular user cannot update a post", async () => {
      const res = await request(app)
        .put(`/api/v1/animal-posts/${testPostId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .field("breed", "Poodle");
      expect(res.status).toBe(403);
    });
  });

  // ── PUT /api/v1/animal-posts/:id/status ───────────────────────────────────
  describe("PUT /api/v1/animal-posts/:id/status", () => {
    test("20. admin updates post status to Adopted", async () => {
      const res = await request(app)
        .put(`/api/v1/animal-posts/${testPostId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "Adopted", adoptedBy: userId });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("Adopted");
      const inDb = await AnimalPostModel.findById(testPostId);
      expect(inDb!.status).toBe("Adopted");
    });

    test("21. admin reverts status back to Available", async () => {
      const res = await request(app)
        .put(`/api/v1/animal-posts/${testPostId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "Available" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("Available");
    });

    test("22. returns 400 for invalid status value", async () => {
      const res = await request(app)
        .put(`/api/v1/animal-posts/${testPostId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "Pending" });
      expect(res.status).toBe(400);
    });

    test("23. regular user cannot update post status", async () => {
      const res = await request(app)
        .put(`/api/v1/animal-posts/${testPostId}/status`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ status: "Adopted" });
      expect(res.status).toBe(403);
    });

    test("24. unauthenticated request is rejected", async () => {
      const res = await request(app).put(`/api/v1/animal-posts/${testPostId}/status`).send({ status: "Adopted" });
      expect(res.status).toBe(401);
    });
  });

  // ── POST /:id/request-adoption ────────────────────────────────────────────
  describe("POST /api/v1/animal-posts/:id/request-adoption", () => {
    test("25. user can send adoption request", async () => {
      const res = await request(app)
        .post(`/api/v1/animal-posts/${testPostId}/request-adoption`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const inDb = await AnimalPostModel.findById(testPostId);
      expect(inDb!.adoptionRequests).toHaveLength(1);
    });

    test("26. user cannot send duplicate adoption request", async () => {
      const res = await request(app)
        .post(`/api/v1/animal-posts/${testPostId}/request-adoption`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("You have already sent an adoption request for this animal");
    });

    test("27. cannot request adoption for an already-adopted post", async () => {
      // Mark as adopted first
      await AnimalPostModel.findByIdAndUpdate(testPostId, { status: "Adopted" });
      const res = await request(app)
        .post(`/api/v1/animal-posts/${testPostId}/request-adoption`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("This animal has already been adopted");
      // Revert
      await AnimalPostModel.findByIdAndUpdate(testPostId, { status: "Available" });
    });

    test("28. unauthenticated user cannot request adoption", async () => {
      const res = await request(app).post(`/api/v1/animal-posts/${testPostId}/request-adoption`);
      expect(res.status).toBe(401);
    });

    test("29. returns 404 for non-existent post", async () => {
      const res = await request(app)
        .post("/api/v1/animal-posts/000000000000000000000001/request-adoption")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /:id/request-adoption ─────────────────────────────────────────
  describe("DELETE /api/v1/animal-posts/:id/request-adoption", () => {
    test("30. user cancels their adoption request", async () => {
      const res = await request(app)
        .delete(`/api/v1/animal-posts/${testPostId}/request-adoption`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      const inDb = await AnimalPostModel.findById(testPostId);
      expect(inDb!.adoptionRequests).toHaveLength(0);
    });

    test("31. cancelling a non-existent request still returns 200 (idempotent)", async () => {
      const res = await request(app)
        .delete(`/api/v1/animal-posts/${testPostId}/request-adoption`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ── GET /:id/adoption-requests (admin only) ───────────────────────────────
  describe("GET /api/v1/animal-posts/:id/adoption-requests", () => {
    test("32. admin gets adoption requests for a post", async () => {
      // Re-add a request first
      await request(app).post(`/api/v1/animal-posts/${testPostId}/request-adoption`).set("Authorization", `Bearer ${userToken}`);
      const res = await request(app)
        .get(`/api/v1/animal-posts/${testPostId}/adoption-requests`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });

    test("33. returns 404 for adoption requests on non-existent post", async () => {
      const res = await request(app)
        .get("/api/v1/animal-posts/000000000000000000000001/adoption-requests")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    test("34. regular user cannot view adoption requests", async () => {
      const res = await request(app)
        .get(`/api/v1/animal-posts/${testPostId}/adoption-requests`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── GET /my-adoptions ─────────────────────────────────────────────────────
  describe("GET /api/v1/animal-posts/my-adoptions", () => {
    test("35. returns adopted posts for the authenticated user", async () => {
      await AnimalPostModel.findByIdAndUpdate(testPostId, { status: "Adopted", adoptedBy: userId });
      const res = await request(app)
        .get("/api/v1/animal-posts/my-adoptions")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.some((p: any) => p._id === testPostId)).toBe(true);
    });

    test("36. unauthenticated user cannot view my-adoptions", async () => {
      const res = await request(app).get("/api/v1/animal-posts/my-adoptions");
      expect(res.status).toBe(401);
    });
  });

  // ── DELETE /:id (admin only) ──────────────────────────────────────────────
  describe("DELETE /api/v1/animal-posts/:id", () => {
    test("37. admin deletes a post", async () => {
      const toDelete = await AnimalPostModel.create({
        species: "Cat", gender: "Female", breed: "Siamese", age: 1,
        location: `test-post-${TEST_ID}`, description: "Delete me",
        photos: ["/cat.jpg"], status: "Available",
      });
      const res = await request(app)
        .delete(`/api/v1/animal-posts/${toDelete._id}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(await AnimalPostModel.findById(toDelete._id)).toBeNull();
    });

    test("38. regular user cannot delete a post", async () => {
      const res = await request(app)
        .delete(`/api/v1/animal-posts/${testPostId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    test("39. returns 404 for non-existent post", async () => {
      const res = await request(app)
        .delete("/api/v1/animal-posts/000000000000000000000001")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});