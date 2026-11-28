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

// ---- v10: PWA files -------------------------------------------------------
const crypto = require("crypto");
const swSrcPath = path.join(root, "sw.src.js");
const manifestSrcPath = path.join(root, "manifest.src.json");
const swSrc = fs.readFileSync(swSrcPath, "utf8");
const manifestSrc = fs.readFileSync(manifestSrcPath, "utf8");
function iconUri(name) {
  const f = path.join(root, "icons", name);
  if (!fs.existsSync(f)) {
    console.error("missing " + f + " — run: python3 tools/make-icons.py");
    process.exit(1);
  }
  return "data:image/png;base64," + fs.readFileSync(f).toString("base64");
}
const icon192 = iconUri("icon-192.png");
const icon512 = iconUri("icon-512.png");
const iconMask = iconUri("icon-maskable-512.png");
// One build id for the page and the service worker: hash of everything that ships (so any change bumps the cache name).
const build = crypto.createHash("sha256")
  .update(src).update(logic).update(app).update(i18n).update(swSrc).update(manifestSrc)
  .update(icon192).update(icon512).update(iconMask)
  .digest("hex").slice(0, 8);
function fill(text) {
  return text.split("__BUILD__").join(build).split("__ICON192__").join(icon192).split("__ICON512__").join(icon512).split("__ICONMASK__").join(iconMask);
}

const out = fill(inject(
  inject(
    inject(src, "<!--I18N-->", "<script>\n" + banner + i18n + "\n</script>"),
    "<!--LOGIC-->", "<script>\n" + banner + logic + "\n</script>"),
  "<!--APP-->",
  "<script>\n" + banner + app + "\n</script>"
));

fs.writeFileSync(outPath, out);
const swOut = "/* built by node build.js from sw.src.js — do not edit */\n" + fill(swSrc);
fs.writeFileSync(path.join(root, "sw.js"), swOut);
const manifestOut = JSON.stringify(JSON.parse(fill(manifestSrc)), null, 1) + "\n";
fs.writeFileSync(path.join(root, "manifest.webmanifest"), manifestOut);
const bytes = Buffer.byteLength(out);
console.log("Wrote index.html (" + bytes + " bytes), sw.js (" + Buffer.byteLength(swOut) + "), manifest.webmanifest (" + Buffer.byteLength(manifestOut) + ") — build " + build);
