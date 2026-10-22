import fs from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/db";
import { shiftIsoDate, todayInKolkata } from "../src/lib/dates";
import { hashOtp } from "../src/lib/otp";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const app = createApp();

async function resetDatabase(): Promise<void> {
  await prisma.loan.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.user.deleteMany();
}

async function signIn(phone: string): Promise<string> {
  const requested = await request(app).post("/api/auth/request-otp").send({ phone });
  expect(requested.status).toBe(200);
  expect(requested.body).not.toHaveProperty("code");
  expect(JSON.stringify(requested.body)).not.toContain("123456");

  const verified = await request(app).post("/api/auth/verify-otp").send({ phone, code: "123456" });
  expect(verified.status).toBe(200);
  return verified.body.token as string;
}

describe("MiniLedger API", () => {
  beforeEach(resetDatabase);

  it("rejects an invalid phone and an incorrect, expired, reused, or locked code", async () => {
    const invalid = await request(app).post("/api/auth/request-otp").send({ phone: "12345" });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe("VALIDATION_ERROR");

    const phone = "9876543210";
    await request(app).post("/api/auth/request-otp").send({ phone }).expect(200);

    const wrong = await request(app).post("/api/auth/verify-otp").send({ phone, code: "000000" });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.code).toBe("OTP_INVALID");

    await prisma.otpChallenge.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    const expired = await request(app).post("/api/auth/verify-otp").send({ phone, code: "123456" });
    expect(expired.body.error.code).toBe("OTP_EXPIRED");

    await request(app).post("/api/auth/request-otp").send({ phone }).expect(200);
    const token = (await request(app).post("/api/auth/verify-otp").send({ phone, code: "123456" })).body.token;
    expect(token).toEqual(expect.any(String));

    const reused = await request(app).post("/api/auth/verify-otp").send({ phone, code: "123456" });
    expect(reused.body.error.code).toBe("OTP_NOT_FOUND");

    await request(app).post("/api/auth/request-otp").send({ phone }).expect(200);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const locked = await request(app).post("/api/auth/verify-otp").send({ phone, code: "000000" });
      expect(locked.body.error.code).toBe(attempt === 4 ? "OTP_LOCKED" : "OTP_INVALID");
    }
  });

  it("invalidates the previous code when a new one is requested", async () => {
    const phone = "+919876543210";
    await request(app).post("/api/auth/request-otp").send({ phone }).expect(200);
    await prisma.otpChallenge.updateMany({ data: { codeHash: hashOtp(phone, "000000") } });

    await request(app).post("/api/auth/request-otp").send({ phone }).expect(200);
    const oldCode = await request(app).post("/api/auth/verify-otp").send({ phone, code: "000000" });
    expect(oldCode.body.error.code).toBe("OTP_INVALID");

    const verified = await request(app).post("/api/auth/verify-otp").send({ phone, code: "123456" });
    expect(verified.status).toBe(200);
    expect(verified.body.user.phone).toBe(phone);
  });

  it("keeps loans private and calculates lent, repaid, and overdue amounts", async () => {
    const owner = await signIn("9876543210");
    const other = await signIn("9123456789");
    const today = todayInKolkata();
    const auth = { Authorization: `Bearer ${owner}` };

    const overdue = await request(app).post("/api/loans").set(auth).send({
      friendName: "Rahul",
      amount: "100.00",
      dueDate: shiftIsoDate(today, -1),
    });
    expect(overdue.status).toBe(201);
    expect(overdue.body.overdue).toBe(true);
    expect(overdue.body.amountPaise).toBe(10000);

    const dueToday = await request(app)
      .post("/api/loans")
      .set(auth)
      .send({ friendName: "Meera", amount: "50", dueDate: today });
    expect(dueToday.body.overdue).toBe(false);

    const repaid = await request(app)
      .post("/api/loans")
      .set(auth)
      .send({ friendName: "सीता", amount: "25.50", dueDate: shiftIsoDate(today, -3) });
    const future = await request(app)
      .post("/api/loans")
      .set(auth)
      .send({ friendName: "Arun", amount: "10", dueDate: shiftIsoDate(today, 10) });

    const firstRepay = await request(app).post(`/api/loans/${repaid.body.id}/repay`).set(auth);
    const secondRepay = await request(app).post(`/api/loans/${repaid.body.id}/repay`).set(auth);
    expect(firstRepay.status).toBe(200);
    expect(secondRepay.body.repaidAt).toBe(firstRepay.body.repaidAt);
    expect(secondRepay.body.overdue).toBe(false);

    await request(app)
      .post("/api/loans")
      .set({ Authorization: `Bearer ${other}` })
      .send({ friendName: "Hidden", amount: "999", dueDate: shiftIsoDate(today, -1) })
      .expect(201);

    const summary = await request(app).get("/api/summary").set(auth);
    expect(summary.body).toMatchObject({
      totalLentPaise: 18550,
      totalRepaidPaise: 2550,
      overduePaise: 10000,
      outstandingPaise: 16000,
    });

    const list = await request(app).get("/api/loans").set(auth);
    expect(list.body.loans.map((loan: { friendName: string }) => loan.friendName)).toEqual([
      "Rahul",
      "Meera",
      "Arun",
      "सीता",
    ]);

    const hidden = await request(app).post(`/api/loans/${future.body.id}/repay`).set({ Authorization: `Bearer ${other}` });
    expect(hidden.status).toBe(404);

    const unauthenticated = await request(app).get("/api/summary");
    expect(unauthenticated.status).toBe(401);
  });

  it("validates entries and stores a private receipt", async () => {
    const token = await signIn("9988776655");
    const auth = { Authorization: `Bearer ${token}` };
    const today = todayInKolkata();

    const badAmount = await request(app)
      .post("/api/loans")
      .set(auth)
      .send({ friendName: "Rahul", amount: "1.234", dueDate: today });
    expect(badAmount.status).toBe(400);

    const badDate = await request(app)
      .post("/api/loans")
      .set(auth)
      .send({ friendName: "Rahul", amount: "10", dueDate: "2026-02-31" });
    expect(badDate.status).toBe(400);

    const created = await request(app)
      .post("/api/loans")
      .set(auth)
      .field("friendName", "Neha")
      .field("amount", "80")
      .field("dueDate", today)
      .attach("receipt", PNG, { filename: "receipt.png", contentType: "image/png" });
    expect(created.status).toBe(201);
    expect(created.body.hasReceipt).toBe(true);

    const receipt = await request(app)
      .get(`/api/loans/${created.body.id}/receipt`)
      .set(auth)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      });
    expect(receipt.status).toBe(200);
    expect(receipt.headers["content-type"]).toContain("image/png");
    expect(Buffer.isBuffer(receipt.body)).toBe(true);
    expect(receipt.body.subarray(0, 8).equals(PNG.subarray(0, 8))).toBe(true);

    const stranger = await signIn("9012345678");
    const denied = await request(app)
      .get(`/api/loans/${created.body.id}/receipt`)
      .set({ Authorization: `Bearer ${stranger}` });
    expect(denied.status).toBe(404);

    const fake = await request(app)
      .post("/api/loans")
      .set(auth)
      .field("friendName", "Neha")
      .field("amount", "80")
      .field("dueDate", today)
      .attach("receipt", Buffer.from("not an image!!!!"), { filename: "notes.png", contentType: "image/png" });
    expect(fake.status).toBe(400);
    expect(fake.body.error.code).toBe("INVALID_RECEIPT");

    const uploadDir = path.resolve(process.cwd(), "uploads-test");
    const leftovers = await fs.readdir(uploadDir);
    expect(leftovers.some((name) => name.startsWith("incoming-"))).toBe(false);
  });

  it("responds to health checks", async () => {
    const health = await request(app).get("/health");
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ ok: true });
  });
});
