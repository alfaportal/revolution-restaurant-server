const fs = require("fs");
const path = require("path");

const files = [
  path.join(__dirname, "../public/js/owner.js"),
  path.join(__dirname, "../public/js/owner-guard.js"),
];

let obfuscator;
try {
  obfuscator = require("javascript-obfuscator");
} catch {
  console.error("javascript-obfuscator nuk është i instaluar. Asnjë skedar nuk u prek.");
  process.exit(1);
}

if (!process.argv.includes("--write")) {
  console.error("Shto --write vetëm kur do që skedarët e panelit të mbishkruhen.");
  process.exit(1);
}

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const out = obfuscator.obfuscate(source, {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    stringArray: true,
    stringArrayThreshold: 0.5,
  }).getObfuscatedCode();
  fs.writeFileSync(file, out);
  console.log(path.basename(file));
}
