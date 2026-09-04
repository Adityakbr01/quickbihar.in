#!/usr/bin/env node
// Rewrite all ./NN_Name.md and ../NN_Name.md cross-references in
// docs/developers-docs/ tree to point at the new folder-based paths.
// Old → New mapping (file basename only; relative path is computed per file).
const fs = require("fs");
const path = require("path");

const DOCS_DIR = path.resolve(__dirname, "..", "docs", "developers-docs");

// Map: old basename (with .md) → new relative path from DOCS_DIR
const RENAMES = {
  "00_Project_Overview.md": "getting-started/overview.md",
  "01_Folder_Structure.md": "getting-started/folder-structure.md",
  "02_System_Architecture.md": "getting-started/system-architecture.md",
  "03_Frontend.md": "apps/web-dashboard.md",
  "04_Backend.md": "apps/server.md",
  "05_Mobile_App.md": "apps/mobile-app.md",
  "06_API_Flow.md": "apps/api-flow.md",
  "07_Database.md": "data/database.md",
  "08_Authentication.md": "features/authentication.md",
  "09_Authorization_RBAC.md": "features/authorization-rbac.md",
  "10_Product_System.md": "features/products.md",
  "11_Order_System.md": "features/orders.md",
  "12_Payment_System.md": "features/payments.md",
  "13_File_Uploads.md": "features/file-uploads.md",
  "14_Notifications.md": "features/notifications.md",
  "15_Caching.md": "data/caching.md",
  "16_Environment.md": "operations/environment.md",
  "oauth.md": "features/google-oauth.md",
  "GOOGLE_OAUTH_SETUP.md": "features/google-oauth.md",
};

const NUMERIC_RE = /(\.{1,2}\/)(0[0-9]|[12][0-9]|3[0-2])_[A-Za-z_]+\.md/g;
const OAUTH_RE = /(\.{1,2}\/)(oauth|GOOGLE_OAUTH_SETUP)\.md/g;

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.isFile() && p.endsWith(".md")) yield p;
  }
}

function relative(fromFile, toRel) {
  const fromDir = path.dirname(path.resolve(DOCS_DIR, fromFile));
  const toAbs = path.resolve(DOCS_DIR, toRel);
  let rel = path.relative(fromDir, toAbs).split(path.sep).join("/");
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel;
}

function rewriteLinks(content, currentRelFile) {
  let changes = 0;
  const replacer = (match, prefix, numOrOauth) => {
    const oldBase = match.slice(prefix.length); // e.g. "07_Database.md"
    const newRel = RENAMES[oldBase];
    if (!newRel) return match; // unknown — leave alone
    const newPath = relative(currentRelFile, newRel);
    if (newPath === match) return match;
    changes++;
    return prefix + newPath;
  };
  content = content.replace(NUMERIC_RE, replacer);
  content = content.replace(OAUTH_RE, replacer);
  return { content, changes };
}

let totalFiles = 0;
let totalChanges = 0;
const changedFiles = [];

for (const absFile of walk(DOCS_DIR)) {
  const rel = path.relative(DOCS_DIR, absFile).split(path.sep).join("/");
  // Skip the soon-to-be-rewritten files (we'll overwrite them entirely).
  if (
    rel === "README.md" ||
    rel === "08_Authentication.md" ||
    rel === "11_Order_System.md" ||
    rel === "oauth.md" ||
    rel === "operations/environment.md" ||
    rel === "features/authentication.md" ||
    rel === "features/orders.md" ||
    rel === "features/google-oauth.md"
  ) {
    continue;
  }
  const original = fs.readFileSync(absFile, "utf8");
  const { content, changes } = rewriteLinks(original, rel);
  if (changes > 0) {
    fs.writeFileSync(absFile, content, "utf8");
    changedFiles.push(`${rel}  (${changes} links)`);
    totalChanges += changes;
  }
  totalFiles++;
}

console.log(`Scanned ${totalFiles} files.`);
console.log(`Updated ${totalChanges} cross-reference links across ${changedFiles.length} files:`);
changedFiles.forEach((f) => console.log("  " + f));
