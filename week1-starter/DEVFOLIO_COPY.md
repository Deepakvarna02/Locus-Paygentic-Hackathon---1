# Devfolio Submission Copy

## Project Name
Paygentic Invoice Payment Agent

## One-liner
An autonomous invoice settlement agent that sends USDC payouts through Locus and returns policy-aware transaction proof.

## Problem
Small teams and freelancer operations still manage invoice payouts manually. This is slow, error-prone, and difficult to audit when payouts happen across multiple recipients.

## Solution
We built a CLI-first AI payment agent on Locus that validates payout inputs, executes USDC transfers, handles approval-threshold safeguards, and tracks each payout to terminal status.

## Core Features
- Wallet setup verification and live USDC balance checks
- Invoice payout by wallet address and by email escrow
- Approval URL handling for policy threshold scenarios
- Transaction polling and status proof for auditability
- Credits request flow for constrained demo environments
- Optional wrapped API catalog integration to show platform breadth

## How It Works
1. Verify account and retrieve wallet balance.
2. Receive invoice recipient and amount.
3. Validate recipient and amount for safety.
4. Send payout through Locus payment endpoint.
5. If approval is required, surface approval URL.
6. Poll transaction status until final state.
7. Output final proof for bookkeeping and review.

## Why This Matters
This turns a manual AP task into a single, repeatable command flow with built-in safeguards and auditable status outcomes.

## Monetization Potential
The same workflow can be packaged as a payout automation SaaS for agencies and small operations teams who process recurring payouts.

## Tech Stack
- Node.js CLI
- Locus Payments API
- Locus Wrapped API discovery endpoint

## Demo Flow
1. Verify wallet and balance
2. Run one invoice payout
3. Show transaction history proof
4. Optional: show wrapped API catalog access

## Commands Shown
- npm run verify
- npm run balance
- npm run invoice-flow -- email recipient@example.com 0.10 "Invoice #1002"
- npm run transactions -- 5
- npm run wrapped-index (optional)
