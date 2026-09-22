# Freshers2026 security and deployment notes

## Important
This repository contains a Vite frontend and an Express + SQLite backend. The backend currently uses a local SQLite file and in-memory login sessions. That is suitable for a single persistent server, but not for a production Vercel serverless deployment because filesystem writes and in-memory sessions are not durable across instances.

For production, either:
- run the full Express server on a persistent Node host with persistent storage, or
- migrate the backend to Vercel-compatible serverless handlers and an external database/object store before exposing registration, payment, or organizer APIs.

## Credentials
- Never commit .env or real organizer credentials.
- ORGANISER_ID and ORGANISER_PASSWORD are mandatory in production; there are no fallback credentials.
- Rotate any organizer password that was previously committed to the public Git history.
- Keep Razorpay secrets server-side only. Never put RAZORPAY_KEY_SECRET in frontend code or VITE_/NEXT_PUBLIC_ variables.

## Payment safety
The current /api/passes endpoint creates a pending registration. It does not verify a payment. A pass must not be treated as paid until a server-side payment provider verification flow is implemented. QR scanning now rejects unpaid passes.

## Data protection
Organizer/dashboard endpoints require authentication. Public endpoints do not expose organizer dashboard records. Media uploads are limited to JPEG/PNG/WebP and 2 MB.

## Before production
1. Use an external durable database.
2. Use durable server-side sessions (or a signed/managed session system) instead of process memory.
3. Implement server-side payment order creation and signature/webhook verification.
4. Add rate limiting/WAF protection to public registration and login endpoints.
5. Add RBAC before adding cultural-head/branch-coordinator accounts.
6. Add CSRF protection if cookie-based authentication is introduced.
7. Keep participant exports authenticated and scoped to the authorized coordinator.
8. Store uploaded media in private/durable object storage where appropriate; do not expose payment proofs publicly.
9. Test production preview URLs so they cannot access production participant/payment data accidentally.
