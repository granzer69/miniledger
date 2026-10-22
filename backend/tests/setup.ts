import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll } from "vitest";
import { prisma } from "../src/db";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

execSync("npx prisma migrate deploy", {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

afterAll(async () => {
  await prisma.$disconnect();
});
