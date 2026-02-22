# Linkdfund Accountability Protocol: MCP Server

A Model Context Protocol (MCP) interface providing autonomous agents with deterministic access to the Linkdfund Soroban Escrow primitive. This service acts as a secure routing and validation layer between AI execution environments and the underlying blockchain utility SDK.

> [!IMPORTANT]
> **Non-Custodial Regulatory Disclaimer**: This software is provided as a set of non-custodial protocol tools and interfaces. It does not provide financial services, investment advice, or asset management. All transaction signing and private key management are handled locally by the user. This implementation is designed to align with the **Kenyan VASP Act 2025** standards for non-custodial decentralized protocols.

## Architecture

* **Agentic Guardrails:** Implements strict runtime schema validation (Zod) across all tool invocations. Intercepts non-deterministic parameter generation and returns structured error boundaries, forcing autonomous self-correction without crashing the host process.
* **Zero-Liability Execution:** Maintains the protocol's non-custodial architecture. The server constructs, simulates, and routes operations but never handles private keys or cryptographically signs transactions.
* **Standardized Transport:** Utilizes `StdioServerTransport` for seamless integration into compliant agentic environments and developer workflows.

## Core Primitives Exposed

The server exposes the following state-mutating and read-only primitives to authorized models:

* `init_escrow`: Constructs the initialization payload for the state machine.
* `add_milestone`: Appends a funding tranche to an active contract.
* `deposit_funds`: Structures the liquidity lock mechanism.
* `submit_proof`: Routes verified cryptographic proof hashes (e.g., external ledger identifiers).
* `approve_ngo` / `approve_auditor`: Exposes the dual-signature consensus mechanism for automated milestone sign-off.
* `refund_milestone`: Provides administrative exception handling for stalled tranches.
* `get_escrow_status`: Retrieves real-time ledger state and threshold metrics.

## Setup & Deployment

### Dependencies
Ensure the corresponding `linkd-ts-sdk` is built and linked locally or available in the module resolution path.

```bash
npm install
```

### Build

Compiles the TypeScript source into optimized, environment-agnostic ESM modules.

```bash
npm run build
```

### Execution

Initiates the server over standard input/output.

```bash
npm start
```

## Security

This service assumes a trusted relationship with the invoking AI agent or client application. While it guarantees structural validity of the XDR payloads via the SDK and prevents execution halts via Zod schemas, the business logic of *when* to invoke these tools must be governed by the parent application's intelligence layer.

## License

Proprietary. All rights reserved.
