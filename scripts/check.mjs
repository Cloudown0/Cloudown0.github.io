import fs from "node:fs";
import assert from "node:assert/strict";
import crypto from "node:crypto";
const read = (p) => fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
const data = JSON.parse(read("src/content.json"));
const sourceFiles = fs
  .readdirSync("content/projects")
  .filter((f) => f.endsWith(".md"));
assert.equal(
  data.projects.length,
  sourceFiles.length,
  "All source articles must be published",
);
assert.equal(
  new Set(data.projects.map((p) => p.id)).size,
  data.projects.length,
  "Unique routes",
);
let formulaCount = 0;
for (const p of data.projects) {
  assert(
    data.courses.some((c) => c.id === p.course),
    "Known course",
  );
  const article = JSON.parse(read(`dist/content/${p.id}.json`));
  assert(article.html.length > 50, "Nonempty article");
  assert(
    !/katex-error|CLOUDOWNMATHTOKEN|<script\b|javascript:/i.test(article.html),
    `Unsafe or unrendered content: ${p.id}`,
  );
  formulaCount += (article.html.match(/class="katex"/g) || []).length;
  const ids = [...article.html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  for (const h of article.toc)
    assert(ids.includes(h.id), `Broken TOC: ${p.id}/${h.id}`);
}
for (const p of data.thoughts)
  assert(!/katex-error|CLOUDOWNMATHTOKEN|<script\b/i.test(p.html));
const css = read("src/style.css");
assert(!/(?:linear|radial|conic)-gradient\s*\(/i.test(css), "No gradients");
assert(!/box-shadow\s*:/i.test(css), "No raised shadows");
assert(fs.existsSync("dist/assets/Cloudown.png"), "Placeholder image packaged");
assert(fs.existsSync("dist/.nojekyll"), "Pages no-Jekyll marker");
for (const asset of [
  ...read("dist/index.html").matchAll(/(?:src|href)="\.\/([^"#]+)"/g),
])
  assert(fs.existsSync(`dist/${asset[1]}`), `Missing built asset ${asset[1]}`);
if (process.argv.includes("--migration")) {
  const baseline = JSON.parse(read("scripts/migration.json"));
  for (const item of baseline) {
    const hash = crypto
      .createHash("sha256")
      .update(fs.readFileSync(`content/projects/${item.file}`))
      .digest("hex");
    assert.equal(hash, item.sha256, `Original file changed: ${item.file}`);
  }
  console.log(
    `Migration verified: ${baseline.length} files match original SHA-256 hashes.`,
  );
}
console.log(
  `Checks passed: ${data.projects.length} articles, ${formulaCount} formulas, all TOC targets, safe output, packaged assets, design constraints.`,
);
