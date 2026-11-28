#!/usr/bin/env node
"use strict";
/**
 * Assemble index.html from the single source files.
 * Do not edit the inlined scripts in index.html — change logic.js / app.js / index.src.html
 * and run: node build.js
 */
const fs = require("fs");
const path = require("path");

const root = __dirname;
const srcPath = path.join(root, "index.src.html");
const logicPath = path.join(root, "logic.js");
const appPath = path.join(root, "app.js");
const i18nPath = path.join(root, "i18n.js");
const outPath = path.join(root, "index.html");

const src = fs.readFileSync(srcPath, "utf8");
const logic = fs.readFileSync(logicPath, "utf8");
const app = fs.readFileSync(appPath, "utf8");
const i18n = fs.readFileSync(i18nPath, "utf8");

if (!src.includes("<!--LOGIC-->") || !src.includes("<!--APP-->") || !src.includes("<!--I18N-->")) {
  console.error("index.src.html is missing <!--I18N-->, <!--LOGIC--> or <!--APP--> placeholders");
  process.exit(1);
}
if (/<\/script>/i.test(logic) || /<\/script>/i.test(app) || /<\/script>/i.test(i18n)) {
  console.error("logic.js, i18n.js or app.js contains </script>, which would break the inlined page");
  process.exit(1);
}

const banner = "/* built by node build.js — edit i18n.js / logic.js / app.js, not this file */\n";
function inject(hay, token, code) {
  const i = hay.indexOf(token);
  if (i < 0) {
    console.error("missing placeholder " + token);
    process.exit(1);
  }
  // Use slice, not String.replace, so "$&" inside logic.js is left intact.
  return hay.slice(0, i) + code + hay.slice(i + token.length);
}

const out = inject(
  inject(
    inject(src, "<!--I18N-->", "<script>\n" + banner + i18n + "\n</script>"),
    "<!--LOGIC-->", "<script>\n" + banner + logic + "\n</script>"),
  "<!--APP-->",
  "<script>\n" + banner + app + "\n</script>"
);

fs.writeFileSync(outPath, out);
const bytes = Buffer.byteLength(out);
console.log("Wrote " + path.relative(root, outPath) + " (" + bytes + " bytes) from i18n.js + logic.js + app.js + index.src.html");
