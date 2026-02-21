# Linkd MCP Server
> Building the Infrastructure of Trust for the Global South using Rust and Soroban.

> [!IMPORTANT]
> **Non-Custodial Regulatory Disclaimer**: This software is provided as a set of non-custodial protocol tools and interfaces. It does not provide financial services, investment advice, or asset management. All transaction signing and private key management are handled locally by the user. This implementation is designed to align with the **Kenyan VASP Act 2025** standards for non-custodial decentralized protocols.

This guide explains how to connect Claude Code to the `linkd-mcp-server` to interact with our escrow protocol using natural language.

## 1. Build the Server

Ensure the server is compiled:

```bash
cd linkd-mcp-server
npm run build
```

## 2. Configure Claude Code

Add the following configuration to your Claude Code MCP settings (usually in `~/.claude/mcp_config.json` or as an environment variable):

```json
{
  "mcpServers": {
    "linkd": {
      "command": "node",
      "args": ["/absolute/path/to/linkd-mcp-server/dist/index.js"]
    }
  }
}
```

## 3. Interact with the Protocol

Now you can ask Claude Code to perform protocol operations:

- **"Initialize a new escrow for NGO G... with auditor G... and beneficiary G..."**
- **"Prepare a lock donation transaction of 500 tokens for contract C..."**

### How it works:
1. Claude Code calls the MCP tool.
2. The server returns the **Transaction XDR**.
3. Claude Code presents the XDR to you.
4. You sign and submit the XDR through your wallet of choice.

---
Empowering AI agents with "Truth Rail" capabilities.
