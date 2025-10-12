#!/usr/bin/env node
// tools/convert-v2.js  (ESM版)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nowISO = () => new Date().toISOString();

function archiveFile(srcPath) {
  const { dir, name, ext } = path.parse(srcPath);
  const dst = path.join(dir, `${name}.v1${ext}`);
  fs.copyFileSync(srcPath, dst);
  return dst;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function renameKey(obj, from, to) {
  if (obj && Object.prototype.hasOwnProperty.call(obj, from)) {
    obj[to] = obj[from];
    delete obj[from];
  }
}

// ----- canon.json v2 への“形式のみ”変換 -----
function toCanonV2(root) {
  const v2 = Array.isArray(root) ? { entries: root } : { ...root };

  if (!v2.meta) {
    v2.meta = {
      version: "2.0.0",
      source_of_truth: "canon.json",
      timezone: "Asia/Tokyo",
      last_updated: nowISO()
    };
  } else if (!v2.meta.version) {
    v2.meta.version = "2.0.0";
  }

  const normalizeEntry = (e) => {
    if (Object.prototype.hasOwnProperty.call(e, "content") &&
        !Object.prototype.hasOwnProperty.call(e, "content_en")) {
      e["content_en"] = e["content"]; // 値はそのまま
      delete e["content"];
    }
    renameKey(e, "added_at_iso", "added_at");
    return e;
  };

  if (Array.isArray(v2.entries)) {
    v2.entries = v2.entries.map((x) => (typeof x === "object" && x) ? normalizeEntry({ ...x }) : x);
  } else {
    if (Array.isArray(v2.rules)) {
      v2.rules = v2.rules.map((x) => {
        if (typeof x === "object" && x) {
          renameKey(x, "added_at_iso", "added_at");
          if (Object.prototype.hasOwnProperty.call(x, "content") &&
              !Object.prototype.hasOwnProperty.call(x, "content_en")) {
            x.content_en = x.content; // 値はそのまま
            delete x.content;
          }
        }
        return x;
      });
    }
    // glossary / contracts は変更しない
  }
  return v2;
}

// ----- memory.json v2 への“形式のみ”変換 -----
function toMemoryV2(root) {
  const v2 = Array.isArray(root) ? { memory: root } : { ...root };
  const norm = (e) => {
    if (typeof e === "object" && e) renameKey(e, "added_at_iso", "added_at");
    return e;
  };
  if (Array.isArray(v2.memory)) v2.memory = v2.memory.map((x) => norm({ ...x }));
  return v2;
}

function convert(srcPath) {
  const raw = readJson(srcPath);
  const lower = path.basename(srcPath).toLowerCase();

  const archived = archiveFile(srcPath);

  let v2;
  if (lower.includes("canon")) {
    v2 = toCanonV2(raw);
  } else if (lower.includes("memory") || lower.includes("記憶")) {
    v2 = toMemoryV2(raw);
  } else {
    // 汎用フォールバック（値は変えない）
    const cloned = JSON.parse(JSON.stringify(raw));
    const walk = (node) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (node && typeof node === "object") {
        renameKey(node, "content", "content_en");
        renameKey(node, "added_at_iso", "added_at");
        Object.values(node).forEach(walk);
      }
    };
    walk(cloned);
    v2 = cloned;
  }

  writeJson(srcPath, v2);
  console.log(`Archived v1 -> ${archived}`);
  console.log(`Wrote v2   -> ${srcPath}`);
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node tools/convert-v2.js <canon.json> [memory.json]");
  process.exit(1);
}
files.forEach((p) => convert(path.resolve(process.cwd(), p)));