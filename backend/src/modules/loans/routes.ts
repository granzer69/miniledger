import fs from "node:fs";
import path from "node:path";
import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { config } from "../../config";
import { asyncHandler } from "../../lib/asyncHandler";
import { AppError } from "../../lib/errors";
import { ensureUploadDir, extensionForMime } from "../../lib/uploads";
import { requireAuth } from "../../middleware/auth";
import { parseLoanInput } from "./schemas";
import { createLoan, getSummary, listLoans, openReceipt, repayLoan } from "./service";

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      ensureUploadDir();
      callback(null, config.uploadDir);
    },
    filename: (_req, file, callback) => {
      const extension = extensionForMime(file.mimetype) ?? ".bin";
      callback(null, `incoming-${Date.now()}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!extensionForMime(file.mimetype)) {
      callback(new AppError(400, "INVALID_RECEIPT", "Receipt must be a JPEG, PNG, or WebP image"));
      return;
    }
    callback(null, true);
  },
});

function acceptLoanBody(req: Request, res: Response, next: NextFunction): void {
  const contentType = req.header("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    next();
    return;
  }

  upload.single("receipt")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof AppError) {
      next(error);
      return;
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new AppError(400, "RECEIPT_TOO_LARGE", "Receipt images must be 5 MB or smaller"));
      return;
    }
    next(new AppError(400, "INVALID_RECEIPT", "Could not upload that receipt"));
  });
}

export const loansRouter = Router();

loansRouter.use(requireAuth);

loansRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    res.json(await getSummary(req.userId!));
  }),
);

loansRouter.get(
  "/loans",
  asyncHandler(async (req, res) => {
    res.json({ loans: await listLoans(req.userId!) });
  }),
);

loansRouter.post(
  "/loans",
  acceptLoanBody,
  asyncHandler(async (req, res) => {
    try {
      const input = parseLoanInput(req.body);
      const loan = await createLoan(req.userId!, input, req.file);
      res.status(201).json(loan);
    } catch (error) {
      if (req.file?.path) await fs.promises.unlink(req.file.path).catch(() => undefined);
      throw error;
    }
  }),
);

loansRouter.post(
  "/loans/:id/repay",
  asyncHandler(async (req, res) => {
    res.json(await repayLoan(req.userId!, path.basename(req.params.id)));
  }),
);

loansRouter.get(
  "/loans/:id/receipt",
  asyncHandler(async (req, res) => {
    const receipt = await openReceipt(req.userId!, path.basename(req.params.id));
    res.setHeader("Content-Type", receipt.contentType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    fs.createReadStream(receipt.absolutePath).pipe(res);
  }),
);
