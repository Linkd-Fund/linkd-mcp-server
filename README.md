# linkd-mcp-server

Node.js / TypeScript — Model Context Protocol server exposing Linkdfund protocol tools to AI agents.

> [!IMPORTANT]
> **Non-Custodial Regulatory Disclaimer**: This software is provided as a set of non-custodial protocol tools and interfaces. It does not provide financial services, investment advice, or asset management. All transaction signing and private key management are handled locally by the user. This implementation is designed to align with the **Kenyan VASP Act 2025** standards for non-custodial decentralized protocols.

## What This Is

Bridges the Linkdfund smart contract layer to any MCP-compatible AI client (Claude Desktop, Claude Code, custom agents). It:

1. Exposes Soroban contract operations as callable tools — each returns a base64 XDR envelope, never a signed transaction.
2. Provides `audit_expenditure_anchor` for cross-layer cryptographic verification of expenditure bundles.
3. Runs on stdio transport — no HTTP port, no persistent process, no authentication surface.

**It wraps `linkd-ts-sdk`. It does not contain business logic of its own.**

## Source Structure

```
src/
  index.ts    Single file — MCP server, tool registry, all handlers
```

## Tools Exposed

| Tool | Auth Required | Returns | Description |
|------|--------------|---------|-------------|
| `init_escrow` | Admin keypair (external) | XDR string | Initialize Soroban escrow contract with roles and token |
| `add_milestone` | Admin keypair (external) | XDR string | Append a funding milestone |
| `deposit_funds` | Donor keypair (external) | XDR string | Lock SEP-41 tokens into escrow |
| `submit_proof` | NGO keypair (external) | XDR string | Attach KRA eTIMS / IPFS proof hash to milestone |
| `approve_ngo` | NGO keypair (external) | XDR string | NGO cryptographic sign-off on milestone |
| `approve_auditor` | Auditor keypair (external) | XDR string | Auditor cryptographic sign-off — triggers fund release if NGO also approved |
| `refund_milestone` | Admin keypair (external) | XDR string | Cancel stalled milestone, route capital to refund address |
| `get_escrow_status` | None | Text report | Live on-chain read: total escrowed, milestone count, full state |
| `audit_expenditure_anchor` | None | JSON audit report | Recompute bundle hash and verify against Stellar Memo.hash |

All XDR-returning tools produce envelopes that must be signed externally before submission.

## `audit_expenditure_anchor` — Cross-Layer Integrity Check

This tool is the tamper-evidence proof. Given an expenditure bundle and its claimed Stellar transaction hash, it:

1. Recomputes `generateExpenditureHash(invoiceNumber, amount, supplierName, donorIds)` — deterministic
2. Fetches the Stellar transaction from Horizon by `stellarTxHash`
3. Decodes `MEMO_HASH` (base64 → hex)
4. Compares computed hash to on-chain hash

```json
{
  "audit_passed": true,
  "expected_hash": "a3f9...",
  "on_chain_hash": "a3f9...",
  "variance_detected": false
}
```

`variance_detected: true` means the expenditure bundle was tampered or the wrong TX hash was supplied.

> **Known Limitation**: The current implementation in `src/index.ts` passes raw donor IDs directly to `generateExpenditureHash()` instead of routing through `generateAnonymizedExpenditureHash()`. This produces a hash that diverges from the one anchored by `linkd-app` (which anonymizes donor IDs before hashing). The `audit_passed` result will be `false` for any real anchored expenditure until this is corrected to use `generateAnonymizedExpenditureHash()`.

## Setup & Deployment

### Prerequisites

`linkd-ts-sdk` must be built before this package:

```bash
cd ../linkd-ts-sdk && npm run build
```

### Install & Build

```bash
npm install
npm run build    # Compiles to dist/ — required before connecting to Claude Desktop
```

### Development

```bash
npm run dev    # ts-node watch mode
```

## Claude Desktop Integration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "linkd-protocol": {
      "command": "node",
      "args": ["/absolute/path/to/linkd-mcp-server/dist/index.js"]
    }
  }
}
```

## Transport

`StdioServerTransport` — communicates via stdin/stdout. No network listener. No port. No authentication surface.

## Zod Validation

All tool inputs are validated with Zod before reaching `linkd-ts-sdk`. Validation errors are returned as structured text so agents can self-correct:

```
Argument Validation Failed: [ZodError details]
Runtime Error: [message]
```

Do not catch and swallow these — they are the agent's feedback loop.

## Network

Hardcoded to `testnet` in `src/index.ts`. The `audit_expenditure_anchor` tool hits `https://horizon-testnet.stellar.org`.

Before mainnet deployment: change `network: "testnet"` → `network: "mainnet"` and update the Horizon URL. That is the only required change.

## Dependency Chain

```
linkd-mcp-server
  └── linkd-ts-sdk (local — file:../linkd-ts-sdk — must be built first)
  └── @modelcontextprotocol/sdk
  └── @stellar/stellar-sdk ^14.5.0
  └── zod
```

> **Version divergence**: `linkd-mcp-server` depends on `@stellar/stellar-sdk ^14.5.0` while `linkd-ts-sdk` uses `^13.3.0`. This is a latent incompatibility. Stellar SDK has breaking changes between minor versions. Both packages must be aligned before mainnet deployment.

If `linkd-ts-sdk` changes, run `npm run build` in `linkd-ts-sdk/` first, then rebuild this package.

## Security

This service assumes a trusted relationship with the invoking AI agent or client application. It guarantees structural validity of XDR payloads via the SDK and prevents execution halts via Zod schemas. The business logic of *when* to invoke these tools must be governed by the parent application's intelligence layer.

## License

Proprietary. All rights reserved.
