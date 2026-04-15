# 2-Minute Demo Script

## Goal
Show that the agent can settle an invoice with real Locus payment rails and provide status proof.

## Pre-demo setup
```powershell
cd "c:\Users\kotta\Downloads\locus-claude-skills (1)\locus\week1-starter"
$env:LOCUS_API_KEY = "claw_your_key_here"
```

## Live run commands
```powershell
npm run verify
npm run balance
npm run invoice-flow -- email recipient@example.com 0.10 "Invoice #1002"
npm run transactions -- 5
```

Or run the same flow in one command:

```powershell
npm run demo-run -- recipient@example.com 0.10 "Invoice #1002"
```

## Optional bonus command (run only if core flow is done)
```powershell
npm run wrapped-index
```
Use this to quickly prove you can also access Locus pay-per-use wrapped APIs.

## Narration (short)
1. "This is an invoice settlement agent for Locus Week 1."
2. "First, I verify wallet and live USDC balance."
3. "Now I submit one invoice payout through the agent."
4. "If policy approval is required, it returns an approval URL."
5. "Then I show transaction history as proof of settlement flow."

## If approval is required
When output includes `approval_url` and `transaction_id`:
```powershell
npm run poll -- TRANSACTION_ID 30 2
```

## Backup flow
If live payout cannot complete due to policy/funding:
```powershell
npm run request-credits -- "Week 1 live demo credits" 15 "https://github.com/your-org/your-repo"
npm run wait-credits -- 20 30
npm run demo-run -- recipient@example.com 0.10 "Invoice #1002"
```
Then explain that payout command remains identical after funding.
