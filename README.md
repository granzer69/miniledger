# MiniLedger

MiniLedger tracks money you have lent to friends. You sign in with an Indian mobile number, add a loan with a name, amount, and due date, and mark it repaid when the money comes back. Overdue loans are highlighted, and a summary shows what you lent, what was repaid, and what is overdue.

## Prerequisites

- Node.js 22.13 or newer (Expo SDK 58). Node 22.12 prints an engine warning and still runs.
- Docker, for PostgreSQL 16

## Run it

From the repository root, start the database:

```bash
docker compose up -d
```

In one terminal, start the API:

```bash
npm install --prefix backend
npm run dev:api
```

The API listens on [http://localhost:4000](http://localhost:4000). The first start applies the database migration.

In a second terminal, start the app:

```bash
npm install --prefix mobile
npm run web --prefix mobile
```

Open the URL Expo prints, usually [http://localhost:8081](http://localhost:8081).

`mobile/.env.example` sets `EXPO_PUBLIC_API_URL=http://localhost:4000`. Copy it to `mobile/.env` if you need a different API host:

| Where the app runs | API URL |
| --- | --- |
| Web, or an iOS simulator | `http://localhost:4000` |
| Android emulator | `http://10.0.2.2:4000` |
| A phone on the same Wi-Fi | `http://<your-computer-lan-ip>:4000` |

## Sign in

1. Enter a 10-digit Indian mobile number. Numbers starting with 6–9 are accepted, with or without `+91`.
2. Press **Send code**.
3. Read the code in the **API terminal**. It looks like this:

```text
[otp] phone=+919876543210 code=006784 expires in 300s
```

The API never returns the code. It is stored as a SHA-256 hash, expires after 5 minutes, allows 5 attempts, and a new request invalidates the previous code.

## Tests

```bash
npm test
```

That runs the API integration tests against the `miniledger_test` database and the app's pure-function tests. The API tests set `OTP_FIXED_CODE=123456`. The server refuses to start with that variable when `NODE_ENV=production`.

## API

All loan routes need `Authorization: Bearer <token>`.

- `POST /api/auth/request-otp` with `{ "phone": "9876543210" }`
- `POST /api/auth/verify-otp` with `{ "phone": "9876543210", "code": "123456" }`
- `GET /api/summary`
- `GET /api/loans`
- `POST /api/loans` as JSON or multipart form data: `friendName`, `amount`, `dueDate` (`YYYY-MM-DD`), optional `receipt` image
- `POST /api/loans/:id/repay`
- `GET /api/loans/:id/receipt`
- `GET /health`

Errors look like `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`.

## Money and overdue rules

Amounts are stored as integer paise, so `1500.50` is `150050` and never a binary fraction. The app displays them in rupees with Indian grouping.

A loan is overdue when it has not been repaid and its due date is before today in `Asia/Kolkata`. A loan due today is still open. Repaid loans are not overdue. Marking a loan repaid twice does not change the repaid time.

Receipts are optional JPEG, PNG, or WebP images up to 5 MB. The file is checked against its image header and is only returned to the user who owns the loan.

## Record a demo

About two minutes, on a phone-width window:

1. Enter a mobile number and send a code.
2. Show the code in the API log, then enter it.
3. On the empty home screen, point out lent, repaid, and overdue.
4. Add a loan due yesterday. It should be highlighted as overdue and included in the overdue total.
5. Add a second loan due in the future. It stays open, and only the first counts as overdue.
6. Optionally attach a receipt photo on a third entry.
7. Mark the overdue loan repaid and show the summary update: repaid goes up, overdue goes to zero.

## Layout

- `backend` — Express, TypeScript, Prisma, PostgreSQL
- `mobile` — Expo Router and React Native
- `docker-compose.yml` — Postgres for `miniledger` and `miniledger_test`, timezone `Asia/Kolkata`
