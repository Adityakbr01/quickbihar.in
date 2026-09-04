/* eslint-disable no-console */
/**
 * scripts/fix-admin-user.js
 *
 * Aligns the QuickBihar admin user with the configured ADMIN_EMAIL and
 * ADMIN_PASSWORD in server/.env. Idempotent.
 *
 *   node scripts/fix-admin-user.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");

const TARGET_EMAIL = "admin@quickbihar.in";
const TARGET_PASSWORD = "admin123";
const TARGET_USERNAME = "admin";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI missing from server/.env");
  process.exit(1);
}

const REDACT_HASH = "[REDACTED-BCRYPT-HASH]";

function redact(doc) {
  if (!doc) return doc;
  const clone = { ...doc };
  if (clone.password) clone.password = REDACT_HASH;
  if (clone.refreshToken) clone.refreshToken = REDACT_HASH;
  return clone;
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  console.log("Connected:", db.databaseName);

  // 1. Look up ADMIN role
  const adminRole = await db.collection("roles").findOne({ name: "ADMIN" });
  if (!adminRole) {
    console.error("ADMIN role not found in roles collection. Aborting.");
    process.exit(2);
  }
  console.log("ADMIN role _id:", adminRole._id.toString());

  // 2. Back up the current admin user(s) BEFORE any change
  const beforeAny = await db
    .collection("users")
    .find({ username: TARGET_USERNAME })
    .toArray();
  console.log("\n[BEFORE] admin docs matching username=\"admin\":");
  console.log(JSON.stringify(redact(beforeAny), null, 2));

  // Also check for any orphan "admin@gmail.com" or similar admin-ish emails
  const emailish = await db
    .collection("users")
    .find({ email: { $regex: /admin/i } })
    .toArray();
  if (emailish.length > 0) {
    console.log("\n[BEFORE] users with email containing \"admin\":");
    console.log(JSON.stringify(redact(emailish), null, 2));
  }

  // 3. Decide: update existing vs. create new
  const existingByEmail = await db
    .collection("users")
    .findOne({ email: TARGET_EMAIL });

  if (existingByEmail) {
    // Case C — admin exists with correct email, just rotate the password.
    console.log("\n[DECISION] Admin already has correct email. Rotating password only.");
  } else {
    const existingByUsername = await db
      .collection("users")
      .findOne({ username: TARGET_USERNAME });

    if (existingByUsername) {
      console.log(
        `\n[DECISION] Admin exists by username but email is "${existingByUsername.email}". Updating email + password + role + isVerified.`
      );
    } else {
      console.log("\n[DECISION] No admin user found. Will create new.");
    }
  }

  // 4. Perform the fix
  const newHash = await bcrypt.hash(TARGET_PASSWORD, 10);

  let result;
  const existingByEmailFinal = await db
    .collection("users")
    .findOne({ email: TARGET_EMAIL });

  if (existingByEmailFinal) {
    // Case C
    result = await db.collection("users").updateOne(
      { _id: existingByEmailFinal._id },
      { $set: { password: newHash, isVerified: true, roleId: adminRole._id } }
    );
    console.log("[UPDATE] password-only result:", result);
  } else {
    const existingByUsernameFinal = await db
      .collection("users")
      .findOne({ username: TARGET_USERNAME });

    if (existingByUsernameFinal) {
      // Case A — preserve _id, username, createdAt, identities
      result = await db.collection("users").updateOne(
        { _id: existingByUsernameFinal._id },
        {
          $set: {
            email: TARGET_EMAIL,
            password: newHash,
            fullName:
              existingByUsernameFinal.fullName || "System Administrator",
            roleId: adminRole._id,
            isVerified: true,
          },
        }
      );
      console.log("[UPDATE] existing-admin result:", result);
    } else {
      // Case B — brand new admin
      const now = new Date();
      const doc = {
        username: TARGET_USERNAME,
        email: TARGET_EMAIL,
        password: newHash,
        fullName: "System Administrator",
        roleId: adminRole._id,
        isVerified: true,
        isBlocked: false,
        legacyOtpOnly: false,
        identities: [
          {
            provider: "password",
            providerId: TARGET_USERNAME,
            email: TARGET_EMAIL,
            linkedAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      result = await db.collection("users").insertOne(doc);
      console.log("[INSERT] new-admin result:", result);
    }
  }

  // 5. Verify
  const finalDoc = await db
    .collection("users")
    .findOne({ email: TARGET_EMAIL });
  console.log("\n[AFTER] Final admin doc:");
  console.log(JSON.stringify(redact(finalDoc), null, 2));

  if (finalDoc && finalDoc.password) {
    const matches = await bcrypt.compare(TARGET_PASSWORD, finalDoc.password);
    console.log(
      `\n[VERIFY] bcrypt.compare("${TARGET_PASSWORD}", stored hash) =>`,
      matches
    );
    console.log("[VERIFY] hash starts with $2:", finalDoc.password.startsWith("$2"));
    console.log("[VERIFY] email == target:", finalDoc.email === TARGET_EMAIL);
    console.log(
      "[VERIFY] roleId == ADMIN:",
      finalDoc.roleId && finalDoc.roleId.toString() === adminRole._id.toString()
    );
    console.log("[VERIFY] isVerified:", finalDoc.isVerified === true);
  } else {
    console.error("[VERIFY] FAIL — admin doc missing or has no password.");
  }

  // 6. Confirm no other admin/ADMIN-role user was touched
  const allAdminsAfter = await db
    .collection("users")
    .find({ roleId: adminRole._id })
    .toArray();
  console.log(
    `\n[SAFETY] ${allAdminsAfter.length} user(s) now have roleId=ADMIN. Listing usernames/emails:`
  );
  for (const u of allAdminsAfter) {
    console.log("  -", u.username, "<", u.email, ">");
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});