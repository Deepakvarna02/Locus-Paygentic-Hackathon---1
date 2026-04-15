# 🚀 Paygentic Invoice Payment Agent

**Locus Paygentic Hackathon - Week 1 Submission**

> **Autonomously settle invoices in USDC through Locus and get policy-aware transaction proof.**

## The Problem
Freelancers and small teams manually manage invoice payouts across multiple recipients. This is slow, error-prone, and impossible to audit at scale.

## The Solution
A CLI-first payment agent that validates inputs, executes USDC transfers via Locus, handles approval policies, and provides auditable transaction proof—**all in one command**.

## What This Proves
✅ **Real Locus API Usage** - Live USDC transactions on Base chain  
✅ **Policy Guardrails** - Approval URL handling for threshold controls  
✅ **Audit Trail** - Transaction polling to final state with proof  
✅ **B2B Use Case** - Clear monetization path as payout automation SaaS  
✅ **Bonus Breadth** - Wrapped API ecosystem integration  

## Core Capabilities
- 🔐 Wallet verification and live USDC balance checks
- 💳 USDC payout to wallet addresses (EVM)
- 📧 USDC payout via email escrow
- ✅ Approval URL handling for policy thresholds
- 📊 Transaction polling until final state
- 🎯 End-to-end invoice settlement flow
- 🔌 Wrapped API discovery and invocation

## 1) Quick Start (60 seconds)

```powershell
cd week1-starter
$env:LOCUS_API_KEY = "claw_your_key_here"
npm install
npm run verify
npm run balance
npm run invoice-flow -- email recipient@example.com 0.10 "Invoice #1002"
npm run transactions -- 5
```

**That's it!** Your invoice was sent. Proof is displayed. ✅

## 2) Prerequisites

- Node.js 18+
- A Locus API key (starts with `claw_`)

## 3) Set environment (PowerShell)

```powershell
$env:LOCUS_API_KEY = "claw_your_key_here"
```

Optional:

```powershell
$env:LOCUS_API_BASE = "https://beta-api.paywithlocus.com/api"
```

Alternative auth (no env var): save `~/.config/locus/credentials.json`

```json
{
	"api_key": "claw_your_key_here"
}
```

## 4) Quick verify

```powershell
npm run verify
npm run ready-check
```

If this succeeds, your wallet and key are ready.

## 5) Command reference

```powershell
npm run verify
npm run ready-check
npm run balance
npm run request-credits -- "Building a Week 1 payment agent" 15 "https://github.com/your-org/your-repo"
npm run credits-status
npm run wait-credits -- 20 30
npm run transactions -- 10
npm run transactions -- 10 CONFIRMED
npm run send -- 0xRecipientAddressHere 0.10 "Demo payout"
npm run send-email -- recipient@example.com 0.10 "Demo email payout" 30
npm run poll -- TRANSACTION_ID 30 2
npm run invoice-flow -- address 0xRecipientAddressHere 0.10 "Invoice #1001"
npm run invoice-flow -- email recipient@example.com 0.10 "Invoice #1002"
npm run demo-run -- recipient@example.com 0.10 "Invoice #1002"
npm run autopilot -- recipient@example.com 0.10 "Invoice #1002" 120 30
npm run autopilot-safe -- recipient@example.com 0.10 "Invoice #1002" 60 30
npm run funding-help
npm run wrapped-index
npm run wrapped-call -- exa search "{\"query\":\"latest base chain updates\",\"numResults\":3}"
npm run wrapped-call-file -- exa search ./examples/exa-search.json
npm run export-proof -- ./reports/proof.md
npm run submission-check -- ./reports/submission-check.md
```

Wrapped API notes:
- Use `wrapped-index` to list available providers.
- Use `wrapped-call` for one paid API action in your demo as a bonus breadth signal.
- On PowerShell, use `wrapped-call-file` to avoid JSON escaping issues.

Evidence notes:
- Use `export-proof` to generate a markdown report with live API responses for submission backup.
- Use `submission-check` to get a READY/NOT_READY report before final Devfolio submit.

## 6) Safe demo flow for judges

1. `npm run verify`
2. `npm run balance`
3. `npm run invoice-flow -- email recipient@example.com 0.10 "Invoice #1002"`
4. `npm run transactions -- 5`

If balance is zero, request credits first:
1. `npm run request-credits -- "Paygentic Week 1 demo" 5 "https://github.com/your-org/your-repo"`
2. `npm run credits-status`
3. `npm run wait-credits -- 20 30`
4. Run `npm run demo-run -- recipient@example.com 0.10 "Invoice #1002"`

Or run everything after approval in one command:
1. `npm run autopilot -- recipient@example.com 0.10 "Invoice #1002" 120 30`

If you do not want the command to fail on pending credits:
1. `npm run autopilot-safe -- recipient@example.com 0.10 "Invoice #1002" 60 30`
2. It will still generate final reports and tell you the exact unblock step.

For address-based transfer:
1. `npm run send -- 0xRecipientAddressHere 0.10 "Live transfer"`
2. If returned with `approval_url`, approve from browser.
3. `npm run poll -- TRANSACTION_ID 30 2`

## 7) Security notes

- Never print or share your full `LOCUS_API_KEY`.
- Send your key only to `beta-api.paywithlocus.com`.
- Start with small payment amounts for demos.
- Validate recipient addresses before sending real funds.

## 8) Submission Assets & Winning Materials

### Documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Full technical design and reliability approach
- **[DEMO_SCRIPT.md](DEMO_SCRIPT.md)** - 2-minute demo walkthrough for judges
- **[DEVFOLIO_COPY.md](DEVFOLIO_COPY.md)** - Polished submission text (copy-paste ready)
- **[FINAL_CHECKLIST.md](FINAL_CHECKLIST.md)** - Pre-submission quality checklist

### Proof Reports
- **[reports/proof-final.md](reports/proof-final.md)** - Real transaction execution evidence
- **[reports/submission-check-final.md](reports/submission-check-final.md)** - Readiness verification

### Key Submission Points
1. **Real Payments** - Live USDC transactions on Base chain (not mock)
2. **Policy Handling** - Approval URL flow for threshold protection
3. **Proof Generation** - Transaction polling with auditable status trail
4. **Business Value** - Clear B2B use case with SaaS monetization path
5. **API Breadth** - Optional wrapped API integration showcase

## Repository
📍 **GitHub**: https://github.com/Deepakvarna02/Locus-Paygentic-Hackathon---1

---

**Ready to submit!** Follow [DEMO_SCRIPT.md](DEMO_SCRIPT.md) and use [DEVFOLIO_COPY.md](DEVFOLIO_COPY.md) for Devfolio submission.
