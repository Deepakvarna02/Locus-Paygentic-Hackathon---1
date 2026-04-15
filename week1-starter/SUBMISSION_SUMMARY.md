# Submission Summary

## Project
Paygentic Invoice Payment Agent

## One-line pitch
An agent that autonomously settles invoices in USDC through Locus and returns policy-aware transaction proof.

## What it does
- Verifies wallet setup and balance
- Requests build credits when needed
- Sends USDC to wallet addresses
- Sends USDC to emails via escrow
- Handles approval-threshold flows
- Polls transaction status to final state
- Provides quick command workflow for invoice settlement
- Includes optional wrapped API discovery to show payment + API breadth

## Why it matters
This reduces payout operations from multiple manual steps into a single agent action with built-in payment safety controls.

## Commands implemented
- `npm run verify`
- `npm run balance`
- `npm run request-credits -- <reason> <amount>`
- `npm run transactions -- [limit] [status]`
- `npm run send -- <to_address> <amount> [memo]`
- `npm run send-email -- <email> <amount> [memo] [expiresInDays]`
- `npm run poll -- <transaction_id> [attempts] [intervalSec]`
- `npm run invoice-flow -- <address|email> <recipient> <amount> [memo]`

## Judging highlights
- Real Locus payment API usage
- Approval URL handling for policy thresholds
- Transaction status proof for auditability
- Practical B2B use case with clear monetization potential
- Bonus capability for wrapped API ecosystem integration
