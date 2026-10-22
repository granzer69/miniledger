import type { Loan } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../db";
import { formatIsoDate, isOverdue, todayInKolkata } from "../../lib/dates";
import { AppError } from "../../lib/errors";
import { formatRupeesFromPaise } from "../../lib/money";
import { assertImageBytes, contentTypeForFilename, ensureUploadDir, resolveReceiptPath, storedReceiptName } from "../../lib/uploads";
import type { LoanInput } from "./schemas";

export type LoanDto = {
  id: string;
  friendName: string;
  amountPaise: number;
  amount: string;
  dueDate: string;
  repaidAt: string | null;
  overdue: boolean;
  hasReceipt: boolean;
  createdAt: string;
};

function toLoanDto(loan: Loan, today = todayInKolkata()): LoanDto {
  const dueDate = formatIsoDate(loan.dueDate);
  return {
    id: loan.id,
    friendName: loan.friendName,
    amountPaise: loan.amountPaise,
    amount: formatRupeesFromPaise(loan.amountPaise),
    dueDate,
    repaidAt: loan.repaidAt?.toISOString() ?? null,
    overdue: isOverdue(dueDate, loan.repaidAt, today),
    hasReceipt: loan.receiptPath != null,
    createdAt: loan.createdAt.toISOString(),
  };
}

function rank(loan: LoanDto): number {
  if (loan.overdue) return 0;
  if (loan.repaidAt == null) return 1;
  return 2;
}

export async function listLoans(userId: string): Promise<LoanDto[]> {
  const loans = await prisma.loan.findMany({ where: { userId } });
  return loans
    .map((loan) => toLoanDto(loan))
    .sort((left, right) => {
      const byStatus = rank(left) - rank(right);
      if (byStatus !== 0) return byStatus;
      if (left.dueDate !== right.dueDate) return left.dueDate < right.dueDate ? -1 : 1;
      if (left.createdAt === right.createdAt) return 0;
      return left.createdAt < right.createdAt ? 1 : -1;
    });
}

export async function createLoan(
  userId: string,
  input: LoanInput,
  receipt?: { path: string; mimetype: string },
): Promise<LoanDto> {
  let storedName: string | undefined;
  if (receipt) {
    storedName = await persistReceipt(receipt);
  }

  try {
    const loan = await prisma.loan.create({
      data: {
        userId,
        friendName: input.friendName,
        amountPaise: input.amount,
        dueDate: input.dueDate,
        receiptPath: storedName,
      },
    });
    return toLoanDto(loan);
  } catch (error) {
    if (storedName) await fs.unlink(resolveReceiptPath(storedName)).catch(() => undefined);
    throw error;
  }
}

async function persistReceipt(file: { path: string; mimetype: string }): Promise<string> {
  ensureUploadDir();
  const storedName = storedReceiptName(file.mimetype);
  const destination = resolveReceiptPath(storedName);
  try {
    await fs.rename(file.path, destination);
  } catch {
    await fs.copyFile(file.path, destination);
    await fs.unlink(file.path);
  }
  try {
    assertImageBytes(destination);
  } catch (error) {
    await fs.unlink(destination).catch(() => undefined);
    throw error;
  }
  return path.basename(destination);
}

export async function repayLoan(userId: string, loanId: string): Promise<LoanDto> {
  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId } });
  if (!loan) throw new AppError(404, "NOT_FOUND", "Entry not found");
  if (loan.repaidAt) return toLoanDto(loan);

  const updated = await prisma.loan.update({
    where: { id: loan.id },
    data: { repaidAt: new Date() },
  });
  return toLoanDto(updated);
}

export async function getSummary(userId: string) {
  const today = todayInKolkata();
  const todayDate = new Date(`${today}T00:00:00.000Z`);
  const [lent, repaid, overdue] = await Promise.all([
    prisma.loan.aggregate({ where: { userId }, _sum: { amountPaise: true } }),
    prisma.loan.aggregate({ where: { userId, repaidAt: { not: null } }, _sum: { amountPaise: true } }),
    prisma.loan.aggregate({
      where: { userId, repaidAt: null, dueDate: { lt: todayDate } },
      _sum: { amountPaise: true },
    }),
  ]);

  const totalLentPaise = lent._sum.amountPaise ?? 0;
  const totalRepaidPaise = repaid._sum.amountPaise ?? 0;
  const overduePaise = overdue._sum.amountPaise ?? 0;
  const outstandingPaise = totalLentPaise - totalRepaidPaise;

  return {
    totalLentPaise,
    totalRepaidPaise,
    overduePaise,
    outstandingPaise,
    totalLent: formatRupeesFromPaise(totalLentPaise),
    totalRepaid: formatRupeesFromPaise(totalRepaidPaise),
    overdue: formatRupeesFromPaise(overduePaise),
    outstanding: formatRupeesFromPaise(outstandingPaise),
  };
}

export async function openReceipt(userId: string, loanId: string): Promise<{ absolutePath: string; contentType: string }> {
  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId } });
  if (!loan?.receiptPath) throw new AppError(404, "NOT_FOUND", "Receipt not found");

  const absolutePath = resolveReceiptPath(loan.receiptPath);
  try {
    await fs.access(absolutePath);
  } catch {
    throw new AppError(404, "NOT_FOUND", "Receipt not found");
  }
  return { absolutePath, contentType: contentTypeForFilename(loan.receiptPath) };
}
