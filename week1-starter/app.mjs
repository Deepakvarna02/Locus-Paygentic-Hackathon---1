import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const API_BASE = process.env.LOCUS_API_BASE || "https://beta-api.paywithlocus.com/api";
const WAPI_INDEX_URL = "https://beta.paywithlocus.com/wapi/index.md";
const TX_FINAL_STATES = new Set([
  "CONFIRMED",
  "FAILED",
  "POLICY_REJECTED",
  "VALIDATION_FAILED",
  "CANCELLED",
  "EXPIRED"
]);

let cachedApiKey = null;

function loadApiKeyFromCredentialsFile() {
  const credentialsPath = path.join(os.homedir(), ".config", "locus", "credentials.json");
  if (!fs.existsSync(credentialsPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(credentialsPath, "utf8");
    const parsed = JSON.parse(raw);
    if (typeof parsed?.api_key === "string" && parsed.api_key.startsWith("claw_")) {
      return parsed.api_key;
    }
  } catch {
    return null;
  }

  return null;
}

function getApiKey() {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  const fromEnv = process.env.LOCUS_API_KEY;
  if (fromEnv && fromEnv.startsWith("claw_")) {
    cachedApiKey = fromEnv;
    return cachedApiKey;
  }

  const fromFile = loadApiKeyFromCredentialsFile();
  if (fromFile) {
    cachedApiKey = fromFile;
    return cachedApiKey;
  }

  return null;
}

function requireApiKey() {
  const key = getApiKey();
  if (!key) {
    console.error("Missing Locus API key.");
    console.error("PowerShell: $env:LOCUS_API_KEY = 'claw_your_key_here'");
    console.error("Or save ~/.config/locus/credentials.json with {\"api_key\":\"claw_...\"}");
    process.exit(1);
  }

  if (!key.startsWith("claw_")) {
    console.error("LOCUS_API_KEY format looks invalid. It should start with 'claw_'.");
    process.exit(1);
  }
}

function assertPositiveAmount(amount) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number.");
  }
}

function validateAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printJson(title, value) {
  console.log(`${title}\n${JSON.stringify(value, null, 2)}`);
}

function getUsdcBalance(balanceData) {
  const raw =
    balanceData?.usdc_balance ?? balanceData?.balance ?? balanceData?.available_balance ?? "0";
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseJsonArg(raw, argName) {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${argName} must be valid JSON.`);
  }
}

function toIsoFileStamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function locusFetch(path, options = {}) {
  requireApiKey();
  const apiKey = getApiKey();

  const {
    retries = 2,
    retryDelayMs = 700,
    retryOnStatus = [429, 500, 502, 503, 504],
    ...requestOptions
  } = options;
  let attempt = 0;

  while (true) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...requestOptions,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(requestOptions.headers || {})
      }
    });

    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    if (response.ok) {
      return payload;
    }

    const shouldRetry = retryOnStatus.includes(response.status) && attempt < retries;
    if (shouldRetry) {
      attempt += 1;
      await sleep(retryDelayMs * attempt);
      continue;
    }

    const detail = payload?.message || payload?.error || JSON.stringify(payload);
    throw new Error(`${response.status} ${response.statusText}: ${detail}`);
  }
}

async function checkBalance() {
  const result = await locusFetch("/pay/balance", { method: "GET" });
  printJson("Balance:", result);
  return result;
}

async function verifySetup() {
  const result = await checkBalance();
  const wallet = result?.data?.wallet_address || "unknown";
  const token = result?.data?.token || "USDC";
  const balance = getUsdcBalance(result?.data);

  console.log("\nSetup verification passed.");
  console.log(`Wallet: ${wallet}`);
  console.log(`Balance: ${balance} ${token}`);
}

async function requestCredits() {
  const reason =
    process.argv[3] ||
    "Building a Week 1 Paygentic hackathon demo that uses paid APIs and USDC payment flows.";
  const requestedAmountUsdc = Number(process.argv[4] || 15);
  const githubUrl = process.argv[5] || process.env.LOCUS_GITHUB_URL;

  if (reason.length < 10) {
    throw new Error("Reason must be at least 10 characters.");
  }
  if (requestedAmountUsdc < 5 || requestedAmountUsdc > 50) {
    throw new Error("requestedAmountUsdc must be between 5 and 50.");
  }
  if (!githubUrl || !/^https:\/\/github\.com\/.+/.test(githubUrl)) {
    throw new Error(
      "githubUrl is required and must look like https://github.com/<owner>/<repo>."
    );
  }

  const result = await locusFetch("/gift-code-requests", {
    method: "POST",
    retries: 0,
    body: JSON.stringify({ reason, requestedAmountUsdc, githubUrl })
  });

  printJson("Credits request response:", result);
}

async function creditsStatus() {
  const result = await locusFetch("/gift-code-requests/mine", { method: "GET" });
  printJson("Credits request status:", result);

  const requests = result?.data;
  if (Array.isArray(requests) && requests.length > 0) {
    const latest = requests[0];
    console.log(`Latest request: ${latest.id}`);
    console.log(`Latest status: ${latest.status}`);
  }

  return result;
}

function getLatestCreditsRequest(statusResult) {
  const requests = statusResult?.data;
  if (!Array.isArray(requests) || requests.length === 0) {
    return null;
  }

  return requests[0];
}

async function waitForCreditsApprovalFromArgs() {
  const attempts = Number(process.argv[3] || 20);
  const intervalSec = Number(process.argv[4] || 30);
  await waitForCreditsApproval(attempts, intervalSec);
}

async function waitForCreditsApproval(attempts = 20, intervalSec = 30) {
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 240) {
    throw new Error("attempts must be an integer between 1 and 240.");
  }
  if (!Number.isFinite(intervalSec) || intervalSec <= 0 || intervalSec > 300) {
    throw new Error("intervalSec must be between 0 and 300.");
  }

  for (let index = 1; index <= attempts; index += 1) {
    const statusResult = await locusFetch("/gift-code-requests/mine", { method: "GET" });
    const latest = getLatestCreditsRequest(statusResult);
    const latestStatus = latest?.status || "NONE";
    const latestId = latest?.id || "N/A";

    console.log(`Credits poll ${index}/${attempts}: status=${latestStatus}, id=${latestId}`);

    if (latestStatus === "APPROVED") {
      console.log("Credits request approved. You can continue with paid commands.");
      return latest;
    }
    if (latestStatus === "DENIED") {
      throw new Error("Credits request was denied. Update request details and submit again.");
    }

    if (index < attempts) {
      await sleep(intervalSec * 1000);
    }
  }

  throw new Error("Credits request is still pending after the polling window.");
}

async function readyCheck() {
  const balanceResult = await checkBalance();
  const usdcBalance = getUsdcBalance(balanceResult?.data);

  if (usdcBalance > 0) {
    console.log("\nDemo readiness: READY");
    console.log("You can run wrapped API and invoice payment commands now.");
    return;
  }

  console.log("\nDemo readiness: BLOCKED (balance is zero)");
  console.log("Checking credit request status...");
  await creditsStatus();
  console.log("\nNext: wait for APPROVED status, then run npm run balance again.");
}

async function runDemoPipeline() {
  const email = process.argv[3] || "recipient@example.com";
  const amount = Number(process.argv[4] || 0.1);
  const memo = process.argv[5] || "Invoice #1002";

  await runDemoPipelineWith(email, amount, memo);
}

async function runDemoPipelineWith(email, amount, memo) {

  if (!validateEmail(email)) {
    throw new Error("Invalid email format for demo-run recipient.");
  }
  assertPositiveAmount(amount);

  console.log("Step 1/4: verify setup");
  await verifySetup();

  const balanceResult = await checkBalance();
  const usdcBalance = getUsdcBalance(balanceResult?.data);
  if (usdcBalance <= 0) {
    throw new Error(
      "Demo is blocked because wallet balance is zero. Run 'npm run wait-credits -- 20 30' or request/fund credits first."
    );
  }

  console.log("Step 2/4: execute invoice flow");
  process.argv[2] = "invoice-flow";
  process.argv[3] = "email";
  process.argv[4] = email;
  process.argv[5] = String(amount);
  process.argv[6] = memo;
  await runInvoiceFlow();

  console.log("Step 3/4: show latest transactions");
  process.argv[2] = "transactions";
  process.argv[3] = "5";
  process.argv[4] = "";
  await listTransactions();

  console.log("Step 4/4: demo pipeline complete");
  console.log("Your terminal output is ready for screen recording and submission evidence.");
}

async function runAutopilotFromArgs() {
  const email = process.argv[3] || "recipient@example.com";
  const amount = Number(process.argv[4] || 0.1);
  const memo = process.argv[5] || "Invoice #1002";
  const attempts = Number(process.argv[6] || 120);
  const intervalSec = Number(process.argv[7] || 30);

  await runAutopilot(email, amount, memo, attempts, intervalSec);
}

async function runAutopilotSafeFromArgs() {
  const email = process.argv[3] || "recipient@example.com";
  const amount = Number(process.argv[4] || 0.1);
  const memo = process.argv[5] || "Invoice #1002";
  const attempts = Number(process.argv[6] || 60);
  const intervalSec = Number(process.argv[7] || 30);

  await runAutopilotSafe(email, amount, memo, attempts, intervalSec);
}

async function runAutopilot(email, amount, memo, attempts, intervalSec) {
  console.log("Autopilot phase 1: waiting for credits approval");
  await waitForCreditsApproval(attempts, intervalSec);

  console.log("Autopilot phase 2: running demo pipeline");
  await runDemoPipelineWith(email, amount, memo);

  console.log("Autopilot phase 3: bonus wrapped API index");
  await fetchWrappedApiIndex();

  console.log("Autopilot phase 4: final reports");
  await exportProofReport(path.join("reports", `proof-final-${toIsoFileStamp()}.md`));
  await submissionCheck(path.join("reports", `submission-check-final-${toIsoFileStamp()}.md`));

  console.log("Autopilot complete.");
}

async function runAutopilotSafe(email, amount, memo, attempts, intervalSec) {
  console.log("Autopilot-safe phase 1: checking/waiting for credits approval");

  let approved = false;
  try {
    await waitForCreditsApproval(attempts, intervalSec);
    approved = true;
  } catch (error) {
    console.log(`Autopilot-safe note: ${error.message}`);
    console.log("Continuing with readiness artifacts instead of failing hard.");
  }

  const balanceResult = await locusFetch("/pay/balance", { method: "GET" });
  const usdcBalance = getUsdcBalance(balanceResult?.data);

  if (approved && usdcBalance > 0) {
    console.log("Autopilot-safe phase 2: running full demo pipeline");
    await runDemoPipelineWith(email, amount, memo);
    console.log("Autopilot-safe phase 3: bonus wrapped API index");
    await fetchWrappedApiIndex();
  } else {
    console.log("Autopilot-safe phase 2 skipped: no spendable USDC yet.");
    console.log("Use one of these options to unblock:");
    console.log("1) Wait and rerun autopilot-safe later.");
    console.log("2) Fund wallet on Base: 0x3c58488a63d6bfe5ed0c61e82323a9cff99c8a53");
  }

  console.log("Autopilot-safe phase 3: generating reports");
  await exportProofReport(path.join("reports", `proof-final-${toIsoFileStamp()}.md`));
  await submissionCheck(path.join("reports", `submission-check-final-${toIsoFileStamp()}.md`));
  console.log("Autopilot-safe complete.");
}

async function fundingHelp() {
  const balanceResult = await locusFetch("/pay/balance", { method: "GET" });
  const usdcBalance = getUsdcBalance(balanceResult?.data);
  const wallet = balanceResult?.data?.wallet_address || "unknown";

  console.log("Funding help:");
  console.log(`- Wallet: ${wallet}`);
  console.log(`- USDC balance: ${usdcBalance}`);
  console.log("- If credits are pending, either wait or self-fund a small amount on Base.");
  console.log("- Suggested self-fund amount: 1 USDC.");
}

async function exportProofReportFromArgs() {
  const outputPathArg = process.argv[3];
  const outputPath = outputPathArg || path.join("reports", `proof-${toIsoFileStamp()}.md`);
  await exportProofReport(outputPath);
}

async function exportProofReport(outputPath) {
  const balanceResult = await locusFetch("/pay/balance", { method: "GET" });
  const creditsResult = await locusFetch("/gift-code-requests/mine", { method: "GET" });
  const transactionsResult = await locusFetch("/pay/transactions?limit=5", { method: "GET" });

  const usdcBalance = getUsdcBalance(balanceResult?.data);
  const wallet = balanceResult?.data?.wallet_address || "unknown";
  const latestCredit = getLatestCreditsRequest(creditsResult);
  const latestCreditStatus = latestCredit?.status || "NONE";
  const txCount = transactionsResult?.data?.pagination?.total ?? 0;

  const reportLines = [
    "# Hackathon Proof Report",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "## Balance",
    `- Wallet: ${wallet}`,
    `- USDC Balance: ${usdcBalance}`,
    "",
    "## Credits",
    `- Latest Request ID: ${latestCredit?.id || "N/A"}`,
    `- Latest Status: ${latestCreditStatus}`,
    "",
    "## Transactions",
    `- Total transactions (reported by API): ${txCount}`,
    "",
    "## Raw API Responses",
    "### /pay/balance",
    "```json",
    JSON.stringify(balanceResult, null, 2),
    "```",
    "### /gift-code-requests/mine",
    "```json",
    JSON.stringify(creditsResult, null, 2),
    "```",
    "### /pay/transactions?limit=5",
    "```json",
    JSON.stringify(transactionsResult, null, 2),
    "```"
  ];

  const folder = path.dirname(outputPath);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  fs.writeFileSync(outputPath, reportLines.join("\n"), "utf8");
  console.log(`Proof report written: ${outputPath}`);
}

async function submissionCheckFromArgs() {
  const outputPathArg = process.argv[3];
  const outputPath = outputPathArg || path.join("reports", `submission-check-${toIsoFileStamp()}.md`);
  await submissionCheck(outputPath);
}

async function submissionCheck(outputPath) {
  const balanceResult = await locusFetch("/pay/balance", { method: "GET" });
  const creditsResult = await locusFetch("/gift-code-requests/mine", { method: "GET" });
  const transactionsResult = await locusFetch("/pay/transactions?limit=10", { method: "GET" });

  const wallet = balanceResult?.data?.wallet_address || "unknown";
  const usdcBalance = getUsdcBalance(balanceResult?.data);
  const latestCredit = getLatestCreditsRequest(creditsResult);
  const latestCreditStatus = latestCredit?.status || "NONE";
  const txTotal = Number(transactionsResult?.data?.pagination?.total || 0);

  const checks = [
    {
      label: "Wallet connected",
      pass: Boolean(wallet && wallet !== "unknown")
    },
    {
      label: "Has spendable USDC balance",
      pass: usdcBalance > 0
    },
    {
      label: "Credit request resolved or not needed",
      pass: latestCreditStatus === "APPROVED" || latestCreditStatus === "NONE" || usdcBalance > 0
    },
    {
      label: "Has transaction proof",
      pass: txTotal > 0
    }
  ];

  const allPass = checks.every((item) => item.pass);
  console.log(`Submission readiness: ${allPass ? "READY" : "NOT_READY"}`);
  checks.forEach((item) => {
    console.log(`- [${item.pass ? "x" : " "}] ${item.label}`);
  });

  const reportLines = [
    "# Submission Readiness Report",
    "",
    `Generated at: ${new Date().toISOString()}`,
    `Overall: ${allPass ? "READY" : "NOT_READY"}`,
    "",
    "## Checks",
    ...checks.map((item) => `- [${item.pass ? "x" : " "}] ${item.label}`),
    "",
    "## Snapshot",
    `- Wallet: ${wallet}`,
    `- USDC Balance: ${usdcBalance}`,
    `- Latest credit status: ${latestCreditStatus}`,
    `- Transaction count: ${txTotal}`,
    "",
    "## Actions",
    ...(allPass
      ? ["- Ready to record final demo and submit to Devfolio."]
      : [
          "- If balance is zero, wait for credits approval or self-fund wallet.",
          "- Run demo flow and ensure at least one transaction is recorded.",
          "- Re-run submission-check before final submit."
        ])
  ];

  const folder = path.dirname(outputPath);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  fs.writeFileSync(outputPath, reportLines.join("\n"), "utf8");
  console.log(`Submission check report written: ${outputPath}`);
}

async function listTransactions() {
  const limit = Number(process.argv[3] || 10);
  const status = process.argv[4];
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Limit must be an integer between 1 and 100.");
  }

  const query = new URLSearchParams({ limit: String(limit) });
  if (status) {
    query.set("status", status);
  }

  const result = await locusFetch(`/pay/transactions?${query.toString()}`, { method: "GET" });
  printJson("Transactions:", result);
}

async function getTransactionById(transactionId) {
  if (!transactionId) {
    throw new Error("transactionId is required.");
  }

  return locusFetch(`/pay/transactions/${transactionId}`, { method: "GET" });
}

async function pollTransactionFromArgs() {
  const transactionId = process.argv[3];
  const attempts = Number(process.argv[4] || 20);
  const intervalSec = Number(process.argv[5] || 2);

  const result = await pollTransaction(transactionId, attempts, intervalSec);
  printJson("Final transaction status:", result);
}

async function pollTransaction(transactionId, attempts = 20, intervalSec = 2) {
  if (!transactionId) {
    throw new Error("Usage: npm run poll -- <transaction_id> [attempts] [intervalSec]");
  }
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 120) {
    throw new Error("attempts must be an integer between 1 and 120.");
  }
  if (!Number.isFinite(intervalSec) || intervalSec <= 0 || intervalSec > 30) {
    throw new Error("intervalSec must be between 0 and 30.");
  }

  for (let index = 1; index <= attempts; index += 1) {
    const tx = await getTransactionById(transactionId);
    const status = tx?.data?.status || "UNKNOWN";
    console.log(`Poll ${index}/${attempts}: status=${status}`);

    if (TX_FINAL_STATES.has(status)) {
      return tx;
    }

    if (index < attempts) {
      await sleep(intervalSec * 1000);
    }
  }

  throw new Error("Transaction did not reach a final state before timeout.");
}

async function sendPayment() {
  const to_address = process.argv[3];
  const amount = Number(process.argv[4]);
  const memo = process.argv[5] || "Hackathon demo payout";

  if (!to_address || Number.isNaN(amount)) {
    throw new Error("Usage: npm run send -- <to_address> <amount> [memo]");
  }
  if (!validateAddress(to_address)) {
    throw new Error("Invalid recipient address. Must be 0x + 40 hex chars.");
  }
  assertPositiveAmount(amount);

  const result = await locusFetch("/pay/send", {
    method: "POST",
    retries: 0,
    body: JSON.stringify({ to_address, amount, memo })
  });

  printJson("Send response:", result);

  const txId = result?.data?.transaction_id;
  if (result?.data?.approval_url) {
    console.log(`Approval required. Open this URL: ${result.data.approval_url}`);
    if (txId) {
      console.log(`After approval, track with: npm run poll -- ${txId} 30 2`);
    }
    return;
  }

  if (txId) {
    console.log(`Track this transaction: npm run poll -- ${txId} 30 2`);
  }
}

async function sendEmailPayment() {
  const email = process.argv[3];
  const amount = Number(process.argv[4]);
  const memo = process.argv[5] || "Hackathon demo email payout";
  const expiresInDays = Number(process.argv[6] || 30);

  if (!email || Number.isNaN(amount)) {
    throw new Error("Usage: npm run send-email -- <email> <amount> [memo] [expiresInDays]");
  }
  if (!validateEmail(email)) {
    throw new Error("Invalid email format.");
  }
  assertPositiveAmount(amount);
  if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 365) {
    throw new Error("expiresInDays must be an integer between 1 and 365.");
  }

  const result = await locusFetch("/pay/send-email", {
    method: "POST",
    retries: 0,
    body: JSON.stringify({
      email,
      amount,
      memo,
      expires_in_days: expiresInDays
    })
  });

  printJson("Send email response:", result);
}

async function runInvoiceFlow() {
  const recipientType = process.argv[3];
  const recipient = process.argv[4];
  const amount = Number(process.argv[5]);
  const memo = process.argv[6] || "Invoice settlement by Paygentic Week 1 agent";

  if (!recipientType || !recipient || Number.isNaN(amount)) {
    throw new Error(
      "Usage: npm run invoice-flow -- <address|email> <recipient> <amount> [memo]"
    );
  }

  const balanceResult = await checkBalance();
  const currentBalance = getUsdcBalance(balanceResult?.data);
  if (Number.isFinite(currentBalance) && currentBalance < amount) {
    throw new Error(
      `Insufficient wallet balance for this invoice. Balance=${currentBalance}, required=${amount}`
    );
  }

  let sendResult;
  if (recipientType === "address") {
    if (!validateAddress(recipient)) {
      throw new Error("Invalid address recipient.");
    }
    sendResult = await locusFetch("/pay/send", {
      method: "POST",
      retries: 0,
      body: JSON.stringify({ to_address: recipient, amount, memo })
    });
  } else if (recipientType === "email") {
    if (!validateEmail(recipient)) {
      throw new Error("Invalid email recipient.");
    }
    sendResult = await locusFetch("/pay/send-email", {
      method: "POST",
      retries: 0,
      body: JSON.stringify({
        email: recipient,
        amount,
        memo,
        expires_in_days: 30
      })
    });
  } else {
    throw new Error("recipientType must be 'address' or 'email'.");
  }

  printJson("Invoice flow payment response:", sendResult);

  const txId = sendResult?.data?.transaction_id;
  const approvalUrl = sendResult?.data?.approval_url;
  if (approvalUrl) {
    console.log(`Approval required: ${approvalUrl}`);
  }

  if (txId && !approvalUrl) {
    console.log("Polling transaction for settlement proof...");
    const finalTx = await pollTransaction(txId, 20, 2);
    printJson("Invoice flow final transaction:", finalTx);
  } else if (txId && approvalUrl) {
    console.log(`After approval, run: npm run poll -- ${txId} 30 2`);
  }
}

async function fetchWrappedApiIndex() {
  const response = await fetch(WAPI_INDEX_URL, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Failed to fetch wrapped API index: ${response.status} ${response.statusText}`);
  }

  const markdown = await response.text();
  console.log("Wrapped API catalog (markdown):\n");
  console.log(markdown);
}

async function callWrappedApi() {
  const provider = process.argv[3];
  const endpoint = process.argv[4];
  const bodyArg = process.argv.slice(5).join(" ");

  if (!provider || !endpoint) {
    throw new Error(
      "Usage: npm run wrapped-call -- <provider> <endpoint> [jsonBody]"
    );
  }

  const payload = parseJsonArg(bodyArg, "jsonBody");
  const result = await locusFetch(`/wrapped/${provider}/${endpoint}`, {
    method: "POST",
    retries: 0,
    body: JSON.stringify(payload)
  });

  printJson("Wrapped API response:", result);
}

async function callWrappedApiFromFile() {
  const provider = process.argv[3];
  const endpoint = process.argv[4];
  const jsonFilePath = process.argv[5];

  if (!provider || !endpoint || !jsonFilePath) {
    throw new Error(
      "Usage: npm run wrapped-call-file -- <provider> <endpoint> <jsonFilePath>"
    );
  }

  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`JSON file not found: ${jsonFilePath}`);
  }

  const raw = fs.readFileSync(jsonFilePath, "utf8");
  const payload = parseJsonArg(raw, "jsonFilePath content");

  const result = await locusFetch(`/wrapped/${provider}/${endpoint}`, {
    method: "POST",
    retries: 0,
    body: JSON.stringify(payload)
  });

  printJson("Wrapped API response:", result);
}

function printUsage() {
  console.log("Usage:");
  console.log("  npm run verify");
  console.log("  npm run ready-check");
  console.log("  npm run balance");
  console.log("  npm run request-credits -- [reason] [amount] [githubUrl]");
  console.log("  npm run credits-status");
  console.log("  npm run wait-credits -- [attempts] [intervalSec]");
  console.log("  npm run transactions -- [limit] [status]");
  console.log("  npm run send -- <to_address> <amount> [memo]");
  console.log("  npm run send-email -- <email> <amount> [memo] [expiresInDays]");
  console.log("  npm run poll -- <transaction_id> [attempts] [intervalSec]");
  console.log("  npm run invoice-flow -- <address|email> <recipient> <amount> [memo]");
  console.log("  npm run demo-run -- [recipientEmail] [amount] [memo]");
  console.log("  npm run autopilot -- [recipientEmail] [amount] [memo] [attempts] [intervalSec]");
  console.log("  npm run autopilot-safe -- [recipientEmail] [amount] [memo] [attempts] [intervalSec]");
  console.log("  npm run funding-help");
  console.log("  npm run wrapped-index");
  console.log("  npm run wrapped-call -- <provider> <endpoint> [jsonBody]");
  console.log("  npm run wrapped-call-file -- <provider> <endpoint> <jsonFilePath>");
  console.log("  npm run export-proof -- [outputPath]");
  console.log("  npm run submission-check -- [outputPath]");
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case "verify":
      await verifySetup();
      break;
    case "ready-check":
      await readyCheck();
      break;
    case "balance":
      await checkBalance();
      break;
    case "request-credits":
      await requestCredits();
      break;
    case "credits-status":
      await creditsStatus();
      break;
    case "wait-credits":
      await waitForCreditsApprovalFromArgs();
      break;
    case "transactions":
      await listTransactions();
      break;
    case "send":
      await sendPayment();
      break;
    case "send-email":
      await sendEmailPayment();
      break;
    case "poll":
      await pollTransactionFromArgs();
      break;
    case "invoice-flow":
      await runInvoiceFlow();
      break;
    case "demo-run":
      await runDemoPipeline();
      break;
    case "autopilot":
      await runAutopilotFromArgs();
      break;
    case "autopilot-safe":
      await runAutopilotSafeFromArgs();
      break;
    case "funding-help":
      await fundingHelp();
      break;
    case "wrapped-index":
      await fetchWrappedApiIndex();
      break;
    case "wrapped-call":
      await callWrappedApi();
      break;
    case "wrapped-call-file":
      await callWrappedApiFromFile();
      break;
    case "export-proof":
      await exportProofReportFromArgs();
      break;
    case "submission-check":
      await submissionCheckFromArgs();
      break;
    default:
      printUsage();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("Command failed:", error.message);
  process.exit(1);
});
