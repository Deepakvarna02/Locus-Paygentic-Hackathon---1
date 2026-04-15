# Architecture - Week 1 Invoice Payment Agent

## Problem
Freelancers and small teams lose time manually settling invoice payouts and proving settlement status.

## Solution
A Locus-powered agent that takes invoice recipient + amount, validates inputs, executes USDC payment, and returns proof of settlement with policy-aware approval handling.

## Core flow
1. Verify wallet and USDC balance.
2. Validate invoice recipient and amount.
3. Execute payout via one of two paths:
   - wallet address: `/api/pay/send`
   - email escrow: `/api/pay/send-email`
4. If threshold policy triggers approval, surface `approval_url`.
5. Poll transaction status using `/api/pay/transactions/:id`.
6. Return final status summary for bookkeeping and audit.

## Why this is strong for Week 1
- Uses real Locus payment primitives end-to-end.
- Demonstrates policy guardrails (approval, limits, error handling).
- Produces visible transaction trail for judges.
- Clear business use case that can monetize as a payout automation SaaS.

## Reliability design
- Fast fail on missing or malformed API key.
- Input guards for amount, email, and EVM address.
- Bounded polling with clear timeout messages.
- Limited retry on transient API failures (`429`, `5xx`) for safe read paths.
- No automatic retry for payment-creating POST operations to avoid duplicate send risk.

## Security design
- API key only from environment variable.
- API key format check (`claw_`).
- Explicit note to send key only to `beta-api.paywithlocus.com`.

## Scope boundaries
Included:
- verification
- credits request
- address/email payouts
- transaction polling
- invoice settlement command

Deferred:
- wrapped API multi-provider integrations
- checkout session automation
- Laso card flow

These are omitted intentionally to maximize completion quality before deadline.
