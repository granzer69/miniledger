import jwt from "jsonwebtoken";
import { config } from "../../config";
import { prisma } from "../../db";
import { AppError } from "../../lib/errors";
import { generateOtpCode, hashOtp, otpHashesMatch } from "../../lib/otp";

export async function requestOtp(phone: string): Promise<{ expiresInSeconds: number }> {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + config.otpTtlSeconds * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.otpChallenge.updateMany({
      where: { phone, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await tx.otpChallenge.create({
      data: {
        phone,
        codeHash: hashOtp(phone, code),
        expiresAt,
      },
    });
  });

  console.log(`[otp] phone=${phone} code=${code} expires in ${config.otpTtlSeconds}s`);
  return { expiresInSeconds: config.otpTtlSeconds };
}

export async function verifyOtp(phone: string, code: string): Promise<{ token: string; user: { id: string; phone: string } }> {
  const challenge = await prisma.otpChallenge.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    throw new AppError(400, "OTP_NOT_FOUND", "Request a code first");
  }
  if (challenge.expiresAt.getTime() <= Date.now()) {
    throw new AppError(400, "OTP_EXPIRED", "That code has expired. Request a new one");
  }
  if (challenge.attempts >= config.otpMaxAttempts) {
    throw new AppError(400, "OTP_LOCKED", "Too many incorrect attempts. Request a new code");
  }

  if (!otpHashesMatch(challenge.codeHash, hashOtp(phone, code))) {
    const updated = await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    if (updated.attempts >= config.otpMaxAttempts) {
      throw new AppError(400, "OTP_LOCKED", "Too many incorrect attempts. Request a new code");
    }
    const left = config.otpMaxAttempts - updated.attempts;
    throw new AppError(400, "OTP_INVALID", `That code is incorrect. ${left} ${left === 1 ? "attempt" : "attempts"} left`);
  }

  const consumed = await prisma.otpChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (consumed.count !== 1) {
    throw new AppError(400, "OTP_NOT_FOUND", "Request a code first");
  }

  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });

  const token = jwt.sign({ sub: user.id, phone: user.phone }, config.jwtSecret, { expiresIn: "7d" });
  return { token, user: { id: user.id, phone: user.phone } };
}
