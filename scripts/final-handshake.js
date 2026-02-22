
import { Keypair, TransactionBuilder, Account, BASE_FEE, Networks, Contract, rpc, nativeToScVal, Address, xdr } from "@stellar/stellar-sdk";

const contractId = "CA5O24QV7UXTE4OFHULDAF5QWQOW6MJMN6NSMSMYUFCVLFBEUNMFESMT";
const auditorAddress = "GCVARRTZXCICMT2KDXVYDVE3Q3GNPDKWHJQDJIFYEGHOWA3PSPQ4263I";
const server = new rpc.Server("https://soroban-testnet.stellar.org");

async function run() {
    console.log("--- FINAL HANDSHAKE DIAGNOSTIC ---");
    const accountReq = await server.getAccount(auditorAddress);
    const account = new Account(auditorAddress, accountReq.sequenceNumber());

    const contract = new Contract(contractId);
    const op = contract.call("approve_auditor", nativeToScVal(0, { type: "u32" }));

    const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
    }).addOperation(op).setTimeout(30).build();

    console.log("Simulating approve_auditor(0)...");
    const simulated = await server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(simulated)) {
        console.log("\n[!] Simulation Failed!");
        console.log("Error:", simulated.error);
        if (simulated.events) {
            console.log("\nEvents Trace:");
            simulated.events.forEach((e, i) => {
                console.log(`${i}: ${e.event().toXDR('base64')}`);
                // Try to decode some info if possible
                try {
                    const data = e.event().body().v0().data();
                    console.log(`   Data: ${data.toXDR('base64')}`);
                } catch (err) { }
            });
        }
    } else {
        console.log("\n[+] SUCCESS! Final XDR:");
        const finalTx = rpc.assembleTransaction(tx, simulated).build();
        console.log(finalTx.toXDR());

        console.log("\n--- FOOTPRINT ANALYSIS ---");
        const resources = simulated.transactionData.toJson();
        console.log(JSON.stringify(resources, null, 2));
    }
}

run().catch(console.error);
