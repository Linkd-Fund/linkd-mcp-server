import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { LinkdSDK } from "linkd-ts-sdk";

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

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "init_escrow",
                description: "Prepares a transaction XDR to initialize a new Linkd Fund escrow contract.",
                inputSchema: {
                    type: "object",
                    properties: {
                        admin: { type: "string", description: "Public key of the administrator" },
                        ngo: { type: "string", description: "Public key of the NGO" },
                        auditor: { type: "string", description: "Public key of the Auditor" },
                        beneficiary: { type: "string", description: "Public key of the target beneficiary" },
                        tokenAddress: { type: "string", description: "SAC Contract ID of the stablecoin (e.g. USDC)" },
                        sourceAccount: { type: "string", description: "Public key of the account paying the Stellar transaction fee" },
                    },
                    required: ["admin", "ngo", "auditor", "beneficiary", "tokenAddress", "sourceAccount"],
                },
            },
            {
                name: "lock_donation",
                description: "Prepares a transaction XDR to lock funds into an existing escrow contract.",
                inputSchema: {
                    type: "object",
                    properties: {
                        donor: { type: "string", description: "Public key of the donor" },
                        amount: { type: "number", description: "Amount of tokens to lock" },
                        contractId: { type: "string", description: "Contract ID of the specific escrow" },
                    },
                    required: ["donor", "amount", "contractId"],
                },
            },
            {
                name: "get_escrow_status",
                description: "Retrieves the current status (total escrowed, milestone count) of a Linkd Fund escrow contract.",
                inputSchema: {
                    type: "object",
                    properties: {
                        contractId: { type: "string", description: "Contract ID of the specific escrow" },
                    },
                    required: ["contractId"],
                },
            },
        ],
    };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        if (name === "init_escrow") {
            const xdr = await sdk.escrow.initEscrow(args as any);
            return {
                content: [
                    {
                        type: "text",
                        text: `Escrow initialization transaction prepared. Please sign this XDR to proceed:\n\n${xdr}`,
                    },
                ],
            };
        }

        if (name === "lock_donation") {
            const xdr = await sdk.escrow.lockDonation(args as any);
            return {
                content: [
                    {
                        type: "text",
                        text: `Donation lock transaction prepared. Please sign this XDR to proceed:\n\n${xdr}`,
                    },
                ],
            };
        }

        if (name === "get_escrow_status") {
            const status = await sdk.escrow.getEscrowStatus((args as any).contractId);
            return {
                content: [
                    {
                        type: "text",
                        text: `Escrow Status for ${(args as any).contractId}:\n- Total Escrowed: ${status.totalEscrowed}\n- Milestones: ${status.milestoneCount}`,
                    },
                ],
            };
        }

        throw new Error(`Tool not found: ${name}`);
    } catch (error: any) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});

/**
 * Start the server
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Linkd MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
