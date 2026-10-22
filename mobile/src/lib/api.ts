import { sanitizeAmount } from "./money";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type Loan = {
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

export type Summary = {
  totalLentPaise: number;
  totalRepaidPaise: number;
  overduePaise: number;
  outstandingPaise: number;
  totalLent: string;
  totalRepaid: string;
  overdue: string;
  outstanding: string;
};

export type ReceiptUpload = {
  uri: string;
  mimeType?: string | null;
  file?: Blob;
};

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function errorMessage(body: unknown, fallback: string): { message: string; code?: string } {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error?: { message?: string; code?: string } }).error;
    return { message: error?.message ?? fallback, code: error?.code };
  }
  return { message: fallback };
}

async function request<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("Can't reach the MiniLedger API. Check that it is running.", 0, "NETWORK");
  }

  const body = await parseBody(response);
  if (!response.ok) {
    const error = errorMessage(body, "Something went wrong");
    throw new ApiError(error.message, response.status, error.code);
  }
  return body as T;
}

export function requestOtp(phone: string) {
  return request<{ ok: boolean; expiresInSeconds: number }>("/api/auth/request-otp", null, {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export function verifyOtp(phone: string, code: string) {
  return request<{ token: string; user: { id: string; phone: string } }>("/api/auth/verify-otp", null, {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
}

export function getSummary(token: string) {
  return request<Summary>("/api/summary", token);
}

export function getLoans(token: string) {
  return request<{ loans: Loan[] }>("/api/loans", token);
}

export function repayLoan(token: string, loanId: string) {
  return request<Loan>(`/api/loans/${loanId}/repay`, token, { method: "POST" });
}

export function createLoan(
  token: string,
  input: { friendName: string; amount: string; dueDate: string; receipt?: ReceiptUpload },
) {
  const form = new FormData();
  form.append("friendName", input.friendName);
  form.append("amount", sanitizeAmount(input.amount));
  form.append("dueDate", input.dueDate);
  if (input.receipt?.file) {
    form.append("receipt", input.receipt.file, "receipt.jpg");
  } else if (input.receipt) {
    form.append("receipt", {
      uri: input.receipt.uri,
      name: "receipt.jpg",
      type: input.receipt.mimeType ?? "image/jpeg",
    } as unknown as Blob);
  }

  return request<Loan>("/api/loans", token, { method: "POST", body: form });
}

export async function fetchReceipt(token: string, loanId: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/loans/${loanId}/receipt`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new ApiError("Couldn't load the receipt", response.status);
  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 8192) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  }
  return `data:${contentType};base64,${btoa(binary)}`;
}
