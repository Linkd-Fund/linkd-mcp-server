import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { LinkdSDK, generateExpenditureHash } from "linkd-ts-sdk";
import { Horizon } from "@stellar/stellar-sdk";
import { z } from "zod";

const sdk = new LinkdSDK({
    network: "testnet",
});

const server = new Server(
    {
        name: "linkd-protocol-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

const InitializeSchema = z.object({
    contractId: z.string().describe("The deployed Soroban contract ID"),
    admin: z.string().describe("Public key of the administrator"),
    ngo: z.string().describe("Public key of the NGO"),
    auditor: z.string().describe("Public key of the Auditor (AI agent/Oracle)"),
    beneficiary: z.string().describe("Public key of the target beneficiary receiving funds"),
    tokenAddress: z.string().describe("SAC Contract ID of the stablecoin (e.g., USDC)"),
});

const AddMilestoneSchema = z.object({
    contractId: z.string(),
    admin: z.string(),
    targetAmount: z.number().positive().describe("Amount in smallest unit"),
});

const DepositSchema = z.object({
    contractId: z.string(),
    donor: z.string().describe("Public key of the donor"),
    amount: z.number().positive(),
});

const SubmitProofSchema = z.object({
    contractId: z.string(),
    ngo: z.string(),
    milestoneId: z.number().int().nonnegative(),
    proofHash: z.string().describe("IPFS CID or eTIMS document hash"),
});

const ApproveSchema = z.object({
    contractId: z.string(),
    signer: z.string().describe("Public key of the authorized role (NGO or Auditor)"),
    milestoneId: z.number().int().nonnegative(),
});

const RefundSchema = z.object({
    contractId: z.string(),
    admin: z.string(),
    milestoneId: z.number().int().nonnegative(),
    refundAddress: z.string(),
});

const GetStatusSchema = z.object({
    contractId: z.string(),
});

const AuditExpenditureSchema = z.object({
    invoiceNumber: z.string().describe("The unique invoice number for the expenditure"),
    amount: z.number().positive().describe("The expenditure amount"),
    supplierName: z.string().describe("The name of the supplier"),
    donorIds: z.array(z.string()).min(1).describe("Array of donor wallet/account IDs"),
    stellarTxHash: z.string().describe("The Stellar transaction hash where the memo was anchored"),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "init_escrow",
                description: "Prepares a transaction XDR to initialize a Linkd Fund escrow contract.",
                inputSchema: { type: "object", properties: {}, ...InitializeSchema.shape },
            },
            {
                name: "add_milestone",
                description: "Prepares a transaction XDR to add a funding milestone.",
                inputSchema: { type: "object", properties: {}, ...AddMilestoneSchema.shape },
            },
            {
                name: "deposit_funds",
                description: "Prepares a transaction XDR to lock funds into the escrow.",
                inputSchema: { type: "object", properties: {}, ...DepositSchema.shape },
            },
            {
                name: "submit_proof",
                description: "Prepares a transaction XDR for the NGO to submit a proof hash (eTIMS/IPFS).",
                inputSchema: { type: "object", properties: {}, ...SubmitProofSchema.shape },
            },
            {
                name: "approve_ngo",
                description: "Prepares a transaction XDR for the NGO to sign off on a milestone.",
                inputSchema: { type: "object", properties: {}, ...ApproveSchema.shape },
            },
            {
                name: "approve_auditor",
                description: "Prepares a transaction XDR for the AI Auditor to sign off on a verified invoice.",
                inputSchema: { type: "object", properties: {}, ...ApproveSchema.shape },
            },
            {
                name: "refund_milestone",
                description: "Prepares a transaction XDR for the Admin to cancel a milestone and refund capital.",
                inputSchema: { type: "object", properties: {}, ...RefundSchema.shape },
            },
            {
                name: "get_escrow_status",
                description: "Retrieves real-time on-chain status (total escrowed, milestone count).",
                inputSchema: { type: "object", properties: {}, ...GetStatusSchema.shape },
            },
            {
                name: "audit_expenditure_anchor",
                description: "Cross-layer audit: recomputes the deterministic expenditure hash and verifies it matches the memo anchored on the Stellar ledger. Returns a strict JSON audit report.",
                inputSchema: { type: "object", properties: {}, ...AuditExpenditureSchema.shape },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;

    try {
        switch (name) {
            case "init_escrow": {
                const args = InitializeSchema.parse(rawArgs);
                const xdr = await sdk.escrow.initialize(args.contractId, args.admin, args.ngo, args.auditor, args.beneficiary, args.tokenAddress);
                return { content: [{ type: "text", text: `Init XDR ready:\n\n${xdr}` }] };
            }
            case "add_milestone": {
                const args = AddMilestoneSchema.parse(rawArgs);
                const xdr = await sdk.escrow.addMilestone(args.contractId, args.admin, args.targetAmount);
                return { content: [{ type: "text", text: `Milestone addition XDR ready:\n\n${xdr}` }] };
            }
            case "deposit_funds": {
                const args = DepositSchema.parse(rawArgs);
                const xdr = await sdk.escrow.deposit(args.contractId, args.donor, args.amount);
                return { content: [{ type: "text", text: `Deposit XDR ready:\n\n${xdr}` }] };
            }
            case "submit_proof": {
                const args = SubmitProofSchema.parse(rawArgs);
                const xdr = await sdk.escrow.submitProof(args.contractId, args.ngo, args.milestoneId, args.proofHash);
                return { content: [{ type: "text", text: `Proof submission XDR ready:\n\n${xdr}` }] };
            }
            case "approve_ngo": {
                const args = ApproveSchema.parse(rawArgs);
                const xdr = await sdk.escrow.approveNgo(args.contractId, args.signer, args.milestoneId);
                return { content: [{ type: "text", text: `NGO approval XDR ready:\n\n${xdr}` }] };
            }
            case "approve_auditor": {
                const args = ApproveSchema.parse(rawArgs);
                const xdr = await sdk.escrow.approveAuditor(args.contractId, args.signer, args.milestoneId);
                return { content: [{ type: "text", text: `Auditor approval XDR ready:\n\n${xdr}` }] };
            }
            case "refund_milestone": {
                const args = RefundSchema.parse(rawArgs);
                const xdr = await sdk.escrow.refundMilestone(args.contractId, args.admin, args.milestoneId, args.refundAddress);
                return { content: [{ type: "text", text: `Refund execution XDR ready:\n\n${xdr}` }] };
            }
            case "get_escrow_status": {
                const args = GetStatusSchema.parse(rawArgs);
                const total = await sdk.escrow.getTotalEscrowed(args.contractId);
                const count = await sdk.escrow.getMilestoneCount(args.contractId);
                return { content: [{ type: "text", text: `Live Ledger State:\n- Total Escrowed: ${total}\n- Milestone Count: ${count}` }] };
            }
            case "audit_expenditure_anchor": {
                const args = AuditExpenditureSchema.parse(rawArgs);

                // Step A: Deterministically recompute the expected hash from the bundle.
                const expectedHash = generateExpenditureHash(
                    args.invoiceNumber,
                    args.amount,
                    args.supplierName,
                    args.donorIds
                );

                // Step B: Fetch the transaction record from the Stellar Horizon network.
                const horizonUrl = "https://horizon-testnet.stellar.org";
                const horizonServer = new Horizon.Server(horizonUrl);
                const tx = await horizonServer.transactions().transaction(args.stellarTxHash).call();

                // Step C: Extract the on-chain memo. MEMO_HASH is returned as a
                // base64-encoded Buffer by stellar-sdk; convert to hex for comparison.
                let onChainHash: string;
                if (tx.memo_type === "hash" && tx.memo) {
                    const memoBytes = Buffer.from(tx.memo, "base64");
                    onChainHash = memoBytes.toString("hex");
                } else {
                    // Treat a missing or non-hash memo as an empty string so the
                    // audit deterministically fails with a meaningful diff.
                    onChainHash = "";
                }

                // Step D: Compare hashes and build the audit report.
                const auditPassed = expectedHash === onChainHash;
                const report = {
                    audit_passed: auditPassed,
                    expected_hash: expectedHash,
                    on_chain_hash: onChainHash,
                    variance_detected: !auditPassed,
                };

                return { content: [{ type: "text", text: JSON.stringify(report, null, 2) }] };
            }
            default:
                throw new Error(`Unrecognized tool: ${name}`);
        }
    } catch (error: any) {
        // Return Zod errors to agent for self-correction
        const errorMessage = error instanceof z.ZodError
            ? `Argument Validation Failed: ${error.message}`
            : `Execution Error: ${error.message}`;

        return {
            content: [{ type: "text", text: errorMessage }],
            isError: true,
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Linkd MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Server fatal error:", error);
    process.exit(1);
});
