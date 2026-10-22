import { z } from "zod";
import { AppError } from "../../lib/errors";
import { parseIsoDate } from "../../lib/dates";
import { rupeesToPaise } from "../../lib/money";
import { normalizeFriendName } from "../../lib/names";

export const loanInputSchema = z.object({
  friendName: z.string().transform((value, ctx) => {
    const name = normalizeFriendName(value);
    if (!name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a friend's name using letters, spaces, and . ' -",
      });
      return z.NEVER;
    }
    return name;
  }),
  amount: z.union([z.string(), z.number()]).transform((value, ctx) => {
    const amount = rupeesToPaise(String(value).trim());
    if (amount == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter an amount greater than 0, up to ₹1,00,00,000, with at most 2 decimal places",
      });
      return z.NEVER;
    }
    return amount;
  }),
  dueDate: z.string().trim().transform((value, ctx) => {
    const date = parseIsoDate(value);
    if (!date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a due date as YYYY-MM-DD" });
      return z.NEVER;
    }
    return date;
  }),
});

export type LoanInput = z.infer<typeof loanInputSchema>;

export function parseLoanInput(body: unknown): LoanInput {
  const result = loanInputSchema.safeParse(body);
  if (!result.success) {
    throw new AppError(400, "VALIDATION_ERROR", result.error.issues[0]?.message ?? "Invalid input");
  }
  return result.data;
}
