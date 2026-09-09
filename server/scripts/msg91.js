import dns from "node:dns";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Force IPv4 so connection matches the whitelisted IPv4 address in MSG91
dns.setDefaultResultOrder("ipv4first");

// Load .env from server root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const authKey = process.env.MSG91_AUTH_KEY;
const integratedNumber = process.env.MSG91_WHATSAPP_NUMBER;
const templateName = process.env.MSG91_WHATSAPP_TEMPLATE;

// Recipient phone and verification code from CLI or default
let recipient = process.argv[2] || "9304922632";
const code = process.argv[3] || "123456";

// Normalize phone: strip spaces and +, prepend 91 if 10-digit Indian number
recipient = recipient.replace(/\D/g, "");
if (recipient.length === 10) {
  recipient = "91" + recipient;
}

const payload = {
  integrated_number: integratedNumber,
  content_type: "template",
  payload: {
    messaging_product: "whatsapp",
    type: "template",
    template: {
      name: templateName,
      language: {
        code: "en_US",
        policy: "deterministic"
      },
      namespace: null,
      to_and_components: [
        {
          to: [recipient],
          components: {
            body_1: {
              type: "text",
              value: code
            },
            button_1: {
              subtype: "url",
              type: "text",
              value: code
            }
          }
        }
      ]
    }
  }
};

async function testMsg91() {
  console.log("========================================");
  console.log("  MSG91 WhatsApp Verification Test");
  console.log("========================================");
  console.log("Template       :", templateName);
  console.log("Sender Number  :", integratedNumber);
  console.log("Recipient (To) :", recipient);
  console.log("OTP Code       :", code);
  console.log("Auth Key       :", authKey ? `${authKey.substring(0, 8)}...` : "NOT FOUND");
  console.log("----------------------------------------");
  console.log("Sending request to MSG91 API...");

  if (!authKey || !integratedNumber || !templateName) {
    console.error("\n[!] Error: Missing MSG91 environment variables in .env.");
    console.error("    Ensure MSG91_AUTH_KEY, MSG91_WHATSAPP_NUMBER, and MSG91_WHATSAPP_TEMPLATE are set.");
    process.exit(1);
  }

  try {
    const res = await fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: authKey
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => null);
    console.log(`HTTP Status    : ${res.status} ${res.statusText}`);
    console.log("Response Body  :", JSON.stringify(data, null, 2));

    if (data?.apiError === "418") {
      console.error("\n[!] MSG91 IP Whitelist Blocked (apiError 418):");
      console.error("    Your IP is blocked because IP Whitelisting is enabled on your MSG91 account.");
      console.error("    Fix: Open MSG91 Dashboard -> Settings -> Security -> IP Whitelist, and add your IP or disable IP restrictions.");
    } else if (res.ok && (data?.status === "success" || data?.hasError === false)) {
      console.log("\n[✓] WhatsApp message request accepted successfully by MSG91!");
    }
  } catch (err) {
    console.error("Network/Execution Error:", err.message);
  }
}

testMsg91();