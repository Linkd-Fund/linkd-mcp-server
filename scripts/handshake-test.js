
import { LinkdClient, LinkdEscrow } from "linkd-ts-sdk";

async function run() {
    const client = new LinkdClient({ network: "testnet" });
    const escrow = new LinkdEscrow(client);

    const contractId = "CA5O24QV7UXTE4OFHULDAF5QWQOW6MJMN6NSMSMYUFCVLFBEUNMFESMT";
    const auditorAddress = "GCVARRTZXCICMT2KDXVYDVE3Q3GNPDKWHJQDJIFYEGHOWA3PSPQ4263I";
    const adminAddress = "GDNBJ2L4ADLHT2QPSVGUE44VOVDP6Y4NR6RNSFXOP4WHAKII4D36LPZ7";
    const ngoAddress = "GDJF3OW2CVALMUG4EACMJEQLHHP23N6FYXQVCWVAHNUHEHO2CZMNKRUN";
    const beneficiaryAddress = "GBLTSK6RUMU2OMETRIST6D3PJDHWJE2SROH3SQKQ2GTBFT6AMZA3CG5I";
    // Using a known testnet USDC or a dummy for tokenAddress
    const tokenAddress = "CCW67Z7V6R6N6HYU72LZZY3HDZCO3Y6K35CA4LQRBAUI7GRN6GKNADC";

    console.log("--- PHASE 4: THE AGENTIC HANDSHAKE DIAGNOSTIC ---");

    try {
        console.log("\n1. GET ESCROW STATUS...");
        const count = await escrow.getMilestoneCount(contractId);
        console.log(`Live Ledger State:\n- Milestone Count: ${count}`);

        if (count === 0) {
            console.log("\n[!] Warning: Milestone 0 not found on ledger.");

            console.log("\n2. TRYING SIMULATION OF INITIALIZE (to check if already init)...");
            try {
                const initXdr = await escrow.initialize(contractId, adminAddress, ngoAddress, auditorAddress, beneficiaryAddress, tokenAddress);
                console.log("Initialize Simulation Success! (Contract was NOT initialized)");
            } catch (e) {
                console.log("Initialize Simulation Failed (Likely already initialized):", e.message);
            }

            console.log("\n3. TRYING SIMULATION OF ADD_MILESTONE (to check admin auth)...");
            try {
                const addXdr = await escrow.addMilestone(contractId, adminAddress, 1000);
                console.log("Add Milestone Simulation Success!");
            } catch (e) {
                console.log("Add Milestone Simulation Failed:", e.message);
            }
        }

        console.log("\n4. ATTEMPTING APPROVE_AUDITOR SIMULATION FOR MILESTONE 0...");
        const xdr = await escrow.approveAuditor(contractId, auditorAddress, 0);
        console.log("SUCCESS!");
        console.log("\n--- RESULTING XDR ---");
        console.log(xdr);
        console.log("--- END XDR ---");

    } catch (error) {
        console.error("\n[!] HANDSHAKE FAILED:", error.message);
        if (error.message.includes("UnreachableCodeReached")) {
            console.error("Diagnosis: The contract panicked. Likely Milestone 0 does not exist on-chain yet.");
        }
    }
}

run();
