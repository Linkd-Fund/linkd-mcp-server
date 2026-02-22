
import { rpc } from "@stellar/stellar-sdk";

const server = new rpc.Server("https://soroban-testnet.stellar.org");
const hashes = [
    "cc272688eeabb03efd74f73994a17fade0b05fea5496c2c8c611a45f4e987134",
    "24ed60b417c41fe8e7ea0956bf09179c9f32fe2110058a73412fb7d767dc855a"
];

async function run() {
    for (const hash of hashes) {
        console.log(`\nChecking Transaction: ${hash}`);
        const result = await server.getTransaction(hash);
        console.log("Status:", result.status);
        if (result.status === "SUCCESS") {
            // result.returnValue is the ScVal returned
            console.log("Success result present.");
        } else {
            console.log("Diagnostic Events:", JSON.stringify(result.diagnosticEvents, null, 2));
        }
    }
}

run();
