
import { rpc, Contract, xdr, nativeToScVal } from "@stellar/stellar-sdk";

const contractId = "CA5O24QV7UXTE4OFHULDAF5QWQOW6MJMN6NSMSMYUFCVLFBEUNMFESMT";
const server = new rpc.Server("https://soroban-testnet.stellar.org");

async function run() {
    console.log(`Diagnostic Simulation for get_milestone(0) on ${contractId}`);

    const contract = new Contract(contractId);
    const op = contract.call("get_milestone", nativeToScVal(0, { type: "u32" }));

    const tx = {
        toXDR: () => op.toXDR().toString("base64"),
        source: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    };

    // Since I don't have a full Tx object, I'll use the rpc.Server.simulateTransaction with a real Tx
    // but with dummy data. Actually, the SDK's escrow simulateView does this.
}
// I'll just use a simpler script that uses the SDK but prints events if it fails.
run();
