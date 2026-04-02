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

test("register -> send otp -> verify -> login success", async () => {
  const registerResponse = await request(app).post("/api/users/register").send({
    username: "Tester",
    mobile: "+10000000001",
    email: "test@example.com",
    password: "Password123",
  });

  expect(registerResponse.status).toBe(201);
  expect(registerResponse.body.mobileVerified).toBe(false);

  const sendOtpResponse = await request(app)
    .post("/api/users/send-otp")
    .send({ mobile: "+10000000001" });

  expect(sendOtpResponse.status).toBe(200);

  const user = await User.findOne({ mobile: "+10000000001" });
  expect(user).toBeTruthy();
  expect(user.otpCode).toBeTruthy();

  const wrongOtp = user.otpCode === "123456" ? "654321" : "123456";

  let verifyWrong = await request(app)
    .post("/api/users/verify-otp")
    .send({ mobile: "+10000000001", otp: wrongOtp });

  expect(verifyWrong.status).toBe(400);
  expect(verifyWrong.body.message).toBe("Invalid OTP");

  const verifyResponse = await request(app)
    .post("/api/users/verify-otp")
    .send({ mobile: "+10000000001", otp: user.otpCode });

  expect(verifyResponse.status).toBe(200);
  expect(verifyResponse.body.message).toBe("Mobile verified");

  const loginResponse = await request(app).post("/api/users/login").send({
    email: "test@example.com",
    password: "Password123",
    mobile: "+10000000001",
  });

  expect(loginResponse.status).toBe(200);
  expect(loginResponse.body.user).toBeTruthy();
  expect(loginResponse.body.user.mobileVerified).toBe(true);
});

test("send otp lock after 5 resend requests in hour", async () => {
  await request(app).post("/api/users/register").send({
    username: "Tester2",
    mobile: "+10000000002",
    email: "test2@example.com",
    password: "Password123",
  });

  for (let i = 0; i < 5; i++) {
    const response = await request(app)
      .post("/api/users/send-otp")
      .send({ mobile: "+10000000002" });
    expect(response.status).toBe(200);
  }

  const blocked = await request(app)
    .post("/api/users/send-otp")
    .send({ mobile: "+10000000002" });
  expect(blocked.status).toBe(429);
});

test("profile update guarded by mobileVerified", async () => {
  // unverified user should get 403 when updating profile
  const user = await User.create({
    username: "TesterUnverified",
    mobile: "+10000000004",
    email: "unverified@example.com",
    password: "Password123",
    mobileVerified: false,
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
  expect(unauthorizedUpdate.body.message).toContain("Verify mobile");

  // verified user can update profile
  user.mobileVerified = true;
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
