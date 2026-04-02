const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const { app } = require("../server");

let mongoServer;

beforeAll(async () => {
  jest.setTimeout(30000);
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

test("register -> login success", async () => {
  const registerResponse = await request(app).post("/api/users/register").send({
    username: "Tester",
    email: "test@example.com",
    password: "Password123",
  });

  expect(registerResponse.status).toBe(201);
  expect(registerResponse.body.email).toBe("test@example.com");

  const loginResponse = await request(app).post("/api/users/login").send({
    email: "test@example.com",
    password: "Password123",
  });

  expect(loginResponse.status).toBe(200);
  expect(loginResponse.body.user).toBeTruthy();
  expect(loginResponse.body.user.email).toBe("test@example.com");
});

test("profile update works without email verification", async () => {
  const user = await User.create({
    username: "Tester",
    email: "test@example.com",
    password: "Password123",
  });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "testjwt",
    {
      expiresIn: "1h",
    },
  );

  const authorizedUpdate = await request(app)
    .put("/api/users/profile")
    .set("Authorization", `Bearer ${token}`)
    .send({ username: "UpdatedName" });

  expect(authorizedUpdate.status).toBe(200);
  expect(authorizedUpdate.body.username).toBe("UpdatedName");
});

test("resend verification email endpoint no longer exists", async () => {
  const response = await request(app)
    .post("/api/users/resend-verification")
    .send({
      email: "test2@example.com",
    });

  expect(response.status).toBe(404);
});
