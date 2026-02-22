
import { LinkdClient, LinkdEscrow, LinkdUtils } from "linkd-ts-sdk";
import { Contract, scValToNative } from "@stellar/stellar-sdk";

async function run() {
    const client = new LinkdClient({ network: "testnet" });
    const escrow = new LinkdEscrow(client);
    const contractId = "CA5O24QV7UXTE4OFHULDAF5QWQOW6MJMN6NSMSMYUFCVLFBEUNMFESMT";

    console.log(`Deep Inspection: ${contractId}`);
    try {
        // Query milestone 0 directly via simulateView
        const milestone = await escrow['simulateView'](contractId, "get_milestone", [LinkdUtils.toScVal(0, "u32")]);
        console.log("Milestone 0 details:", JSON.stringify(milestone, null, 2));

        // Let's try to query instance keys
        // Since LinkdSDK/escrow doesn't have a generic getter, I'll use the rpc directly if I had to, 
        // but let's see if we can get the auditor address.
        // Actually, let's just try to call a dummy function to see the panic trace more clearly if possible.

    } catch (e) {
        console.error("Deep Inspection failed:", e.message);
    }
}

run();
