# Hackathon Proof Report

Generated at: 2026-04-14T14:38:18.516Z

## Balance
- Wallet: 0x3c58488a63d6bfe5ed0c61e82323a9cff99c8a53
- USDC Balance: 3.89

## Credits
- Latest Request ID: 090161a5-7c71-45ca-b790-1a1e372cc542
- Latest Status: APPROVED

## Transactions
- Total transactions (reported by API): 2

## Raw API Responses
### /pay/balance
```json
{
  "success": true,
  "data": {
    "wallet_address": "0x3c58488a63d6bfe5ed0c61e82323a9cff99c8a53",
    "chain": "base",
    "usdc_balance": "3.89",
    "allowance": null,
    "max_transaction_size": null
  }
}
```
### /gift-code-requests/mine
```json
{
  "success": true,
  "data": [
    {
      "id": "090161a5-7c71-45ca-b790-1a1e372cc542",
      "email": "kottapalli.deepakvarma2005@gmail.com",
      "userId": "a2a2ab32-6dbe-4523-aa04-44a52da91da8",
      "reason": "Paygentic Week 1 demo",
      "githubUrl": "https://github.com/your-org/your-repo",
      "requestedAmountUsdc": "5",
      "status": "APPROVED",
      "source": "agent",
      "adminNotes": null,
      "reviewedBy": "88cae641-b492-46f7-bae4-8398096b0bea",
      "reviewedAt": "2026-04-14T14:13:05.034Z",
      "redemptionCodeId": "1acb770a-0ba0-4f9b-9af1-ab8698a9ff5d",
      "createdAt": "2026-04-14T11:30:55.422Z",
      "redemptionCode": {
        "id": "1acb770a-0ba0-4f9b-9af1-ab8698a9ff5d",
        "code": "WWF-8GZ-L8J-2UB",
        "status": "REDEEMED",
        "amountUsdc": "4"
      }
    }
  ]
}
```
### /pay/transactions?limit=5
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "669b0a13-d73b-4324-9e54-e9a0e82e9c49",
        "created_at": "2026-04-14T14:37:57.876Z",
        "status": "CONFIRMED",
        "amount_usdc": "0.01",
        "memo": "Wrapped API call: exa/search",
        "to_address": "0x3c5cbe28eca3b96023c45d3f877da834f1c7d5fa",
        "to_ens_name": null,
        "recipient_email": null,
        "category": "claw_send",
        "tokens": [
          {
            "amount": "0.01",
            "symbol": "USDC",
            "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            "decimals": 18,
            "usdValue": 0.01,
            "amountRaw": "10000000000000000",
            "amountFormatted": "0.01"
          }
        ],
        "tx_hash": "0x913cf8512fe462fe314fedf40028589af368659fed7dce23d6b7fdc8e837dc28"
      },
      {
        "id": "83c91324-276a-403a-a516-651c4d65ac8e",
        "created_at": "2026-04-14T14:37:06.708Z",
        "status": "CONFIRMED",
        "amount_usdc": "0.1",
        "memo": "Invoice #1002",
        "to_address": null,
        "to_ens_name": null,
        "recipient_email": "kottapalli.deepakvarma2005@gmail.com",
        "category": "escrow",
        "tokens": null,
        "tx_hash": "0xc1c0664c55e18fea695cb92d408bc9a20fb34c52bb128c5904ec45a3946dad67"
      }
    ],
    "pagination": {
      "total": 2,
      "limit": 5,
      "offset": 0,
      "has_more": false
    }
  }
}
```