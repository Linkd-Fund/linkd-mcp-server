
import { LinkdClient, LinkdEscrow } from "linkd-ts-sdk";

async function run() {
    const client = new LinkdClient({ network: "testnet" });
    const escrow = new LinkdEscrow(client);
    const contractId = "CA5O24QV7UXTE4OFHULDAF5QWQOW6MJMN6NSMSMYUFCVLFBEUNMFESMT";

    console.log(`Inspecting Contract Storage: ${contractId}`);
    try {
        const count = await escrow.getMilestoneCount(contractId);
        const total = await escrow.getTotalEscrowed(contractId);
        console.log(`Milestone Count: ${count}`);
        console.log(`Total Escrowed: ${total}`);

        if (count > 0) {
            console.log("Fetching Milestone 0 details...");
            // I'll add a getMilestone method to escrow.ts if needed, but I can use simulateView directly
            // For now, let's just see if we can get anything.
        }
    } catch (e) {
        console.error("Inspection failed:", e.message);
    }
}

run();
