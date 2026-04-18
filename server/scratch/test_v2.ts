const BASE_URL = "http://localhost:8000/api/v1";

async function test() {
    console.log("--- Testing Product Enhancements ---");
    // This is hard to test without seed data or an admin token, 
    // but we can at least check if the server is healthy.
    try {
        const configRes = await fetch(`${BASE_URL}/app-config`);
        console.log("App Config Health:", configRes.status === 200 ? "OK" : "Error");
    } catch (e) {
        console.log("Server not reachable");
    }

    console.log("\n--- Testing Refund Policy Endpoints ---");
    try {
        const refundRes = await fetch(`${BASE_URL}/refund-policies/active`);
        console.log("Get Active Refund Policy:", refundRes.status === 404 ? "NOT FOUND (Expected if not seeded)" : refundRes.status);
    } catch (e) {
        console.log("Refund endpoint not reachable");
    }
}

test();
