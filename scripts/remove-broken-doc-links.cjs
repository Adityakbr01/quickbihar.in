#!/usr/bin/env node
// Remove links in docs/developers-docs/ that point to files we deliberately
// did not author (17-32) or to the old oauth.md / GOOGLE_OAUTH_SETUP.md names.
// The pattern is: replace `[text](./NN_Name.md)` with just `text`, and
// `[text](../NN_Name.md)` with just `text`. Also handles bare `dekho [...]`
// or `see [...]` etc. The script is conservative — it only strips links to
// filenames in a deny-list.
const fs = require("fs");
const path = require("path");

const DOCS_DIR = path.resolve(__dirname, "..", "docs", "developers-docs");

// Files we know don't exist on disk and don't intend to author.
const DENY_BASENAMES = new Set([
  "17_Deployment.md",
  "18_Error_Handling.md",
  "19_Security.md",
  "20_Performance.md",
  "21_Codebase_Map.md",
  "22_Dependency_Graph.md",
  "23_Request_Lifecycle.md",
  "24_Developer_Guide.md",
  "25_Add_New_Feature.md",
  "26_Add_New_API.md",
  "27_Add_New_Module.md",
  "28_Add_New_Business_Type.md",
  "29_Common_Mistakes.md",
  "30_Tech_Debt.md",
  "31_Production_Readiness.md",
  "32_TODO.md",
  // Old oauth doc names — replaced by features/google-oauth.md
  "oauth.md",
  "GOOGLE_OAUTH_SETUP.md",
]);

// Match markdown links like `[label](./something.md)` or `[label](../something.md)`.
const LINK_RE = /\[([^\]]+)\]\((\.{1,2}\/[A-Za-z0-9_.-]+\.md)\)/g;

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.isFile() && p.endsWith(".md")) yield p;
  }
}

let totalFiles = 0;
let totalChanges = 0;
const changedFiles = [];

for (const absFile of walk(DOCS_DIR)) {
  const rel = path.relative(DOCS_DIR, absFile).split(path.sep).join("/");
  const original = fs.readFileSync(absFile, "utf8");
  let changes = 0;
  const newContent = original.replace(LINK_RE, (match, label, target) => {
    const base = path.basename(target);
    if (DENY_BASENAMES.has(base)) {
      changes++;
      return label; // drop the link, keep the text
    }
    return match;
  });
  if (changes > 0) {
    fs.writeFileSync(absFile, newContent, "utf8");
    changedFiles.push(`${rel}  (${changes} links removed)`);
    totalChanges += changes;
  }
  totalFiles++;
}

console.log(`Scanned ${totalFiles} files.`);
console.log(`Removed ${totalChanges} broken links across ${changedFiles.length} files:`);
changedFiles.forEach((f) => console.log("  " + f));
