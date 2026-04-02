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

test("register -> verify email -> login success", async () => {
  const registerResponse = await request(app).post("/api/users/register").send({
    username: "Tester",
    email: "test@example.com",
    password: "Password123",
  });

  expect(registerResponse.status).toBe(201);
  expect(registerResponse.body.emailVerified).toBe(false);

  // login should fail until email verified
  const loginPreVerify = await request(app).post("/api/users/login").send({
    email: "test@example.com",
    password: "Password123",
  });
  expect(loginPreVerify.status).toBe(401);

  const user = await User.findOne({ email: "test@example.com" });
  expect(user).toBeTruthy();
  expect(user.emailVerificationToken).toBeTruthy();

  const verifyResponse = await request(app)
    .post("/api/users/verify-email")
    .send({ email: "test@example.com", token: user.emailVerificationToken });

  expect(verifyResponse.status).toBe(200);
  expect(verifyResponse.body.message).toBe("Email verified");

  const loginResponse = await request(app).post("/api/users/login").send({
    email: "test@example.com",
    password: "Password123",
  });

  expect(loginResponse.status).toBe(200);
  expect(loginResponse.body.user).toBeTruthy();
  expect(loginResponse.body.user.emailVerified).toBe(true);
});

test("profile update guarded by emailVerified", async () => {
  // unverified user should get 403 when updating profile
  const user = await User.create({
    username: "TesterUnverified",
    email: "unverified@example.com",
    password: "Password123",
    emailVerified: false,
  });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "testjwt",
    {
      expiresIn: "1h",
    },
  );

  const unauthorizedUpdate = await request(app)
    .put("/api/users/profile")
    .set("Authorization", `Bearer ${token}`)
    .send({ username: "ShouldNotWork" });

  expect(unauthorizedUpdate.status).toBe(403);
  expect(unauthorizedUpdate.body.message).toContain("Verify email");

  // verified user can update profile
  user.emailVerified = true;
  await user.save();

  const tokenVerified = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "testjwt",
    {
      expiresIn: "1h",
    },
  );

  const authorizedUpdate = await request(app)
    .put("/api/users/profile")
    .set("Authorization", `Bearer ${tokenVerified}`)
    .send({ username: "VerifiedName" });

  expect(authorizedUpdate.status).toBe(200);
  expect(authorizedUpdate.body.username).toBe("VerifiedName");
});

test("resend verification email works", async () => {
  await request(app).post("/api/users/register").send({
    username: "Tester2",
    email: "test2@example.com",
    password: "Password123",
  });

  const resendResponse = await request(app)
    .post("/api/users/resend-verification")
    .send({ email: "test2@example.com" });

  expect(resendResponse.status).toBe(200);
  expect(resendResponse.body.message).toBe("Verification email resent");
});
