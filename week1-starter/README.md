# Locus Paygentic Week 1 - Invoice Payment Agent

Submission-ready CLI project for Locus Paygentic Hackathon Week 1.

This app demonstrates:
- wallet verification and balance checks
- credits request flow
- USDC payout to wallet addresses
- USDC payout via email escrow
- approval-aware transaction handling
- transaction polling until final state
- end-to-end invoice settlement flow
- wrapped API discovery and invocation

## 1) Prerequisites

- Node.js 18+
- A Locus API key (starts with `claw_`)

## 2) Set environment (PowerShell)

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

## 3) Quick verify

```powershell
npm run verify
npm run ready-check
```

If this succeeds, your wallet and key are ready.

## 4) Command reference

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

## 5) Safe demo flow for judges

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

## 6) Security notes

- Never print or share your full `LOCUS_API_KEY`.
- Send your key only to `beta-api.paywithlocus.com`.
- Start with small payment amounts for demos.
- Validate recipient addresses before sending real funds.

## 7) Submission assets

- Architecture overview: `ARCHITECTURE.md`
- 2-minute demo script: `DEMO_SCRIPT.md`
- Submission copy: `SUBMISSION_SUMMARY.md`
