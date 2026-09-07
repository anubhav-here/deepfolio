const fs = require("node:fs");
const path = require("node:path");

const source = path.join(__dirname, "site");
const output = path.join(__dirname, "dist");

fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, { recursive: true });

console.log("Built deepfolio into dist/");
