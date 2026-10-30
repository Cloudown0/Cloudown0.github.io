import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import katex from "katex";
import sanitize from "sanitize-html";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const md = new MarkdownIt({ html: true, linkify: true, typographer: false });
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const courses = JSON.parse(
  fs
    .readFileSync(path.join(root, "content/courses.json"), "utf8")
    .replace(/^\uFEFF/, ""),
);
const issues = [];
function compile(source) {
  const math = [];
  const stash = (tex, display) => {
    tex = tex
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"');
    const key = `CLOUDOWNMATHTOKEN${math.length}END`;
    let rendered;
    try {
      rendered = katex.renderToString(tex, {
        displayMode: display,
        throwOnError: true,
        strict: "ignore",
        trust: false,
      });
    } catch (e) {
      issues.push(e.message);
      rendered = katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        errorColor: "#896014",
        strict: "ignore",
        trust: false,
      });
    }
    math.push(rendered);
    return key;
  };
  let text = source.replace(
    /<script\s+type=["']math\/tex(;\s*mode=display)?["']\s*>([\s\S]*?)<\/script>/gi,
    (_, display, tex) => stash(tex, !!display),
  );
  text = text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => stash(tex, true))
    .replace(/(?<![\\$])\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\$)/g, (_, tex) =>
      stash(tex, false),
    );
  let html = sanitize(md.render(text), {
    allowedTags: [
      ...sanitize.defaults.allowedTags,
      "img",
      "details",
      "summary",
    ],
    allowedAttributes: {
      ...sanitize.defaults.allowedAttributes,
      "*": ["id", "class"],
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      th: ["align"],
      td: ["align"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tag, attrs) => ({
        tagName: "a",
        attribs: {
          ...attrs,
          ...(/^https?:/.test(attrs.href || "")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {}),
        },
      }),
    },
  });
  html = html.replace(/<a\b[^>]*class="headerlink"[^>]*><\/a>/g, "");
  const toc = [];
  let n = 0;
  html = html.replace(
    /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/g,
    (_, level, attrs, title) => {
      const id = `section-${++n}`;
      const label = title
        .replace(/<[^>]*>/g, "")
        .replace(/CLOUDOWNMATHTOKEN\d+END/g, "公式");
      if (+level <= 3) toc.push({ id, title: label, level: +level });
      return `<h${level} id="${id}">${title}</h${level}>`;
    },
  );
  html = html.replace(/CLOUDOWNMATHTOKEN(\d+)END/g, (_, i) => math[+i]);
  const plain = source
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    html,
    toc,
    readingMinutes: Math.max(1, Math.ceil(plain.length / 450)),
    search: plain,
  };
}
const chapter = (s) => {
  const m = s.match(/第([一二三四五六七八九十]+)章/);
  const nums = { 一: 1, 二: 2, 三: 3, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11 };
  return nums[m?.[1]] || 99;
};
const projects = fs
  .readdirSync(path.join(root, "content/projects"))
  .filter((f) => f.endsWith(".md"))
  .map((file) => {
    const { data, content } = matter(
      fs.readFileSync(path.join(root, "content/projects", file), "utf8"),
    );
    const course = courses.find(
      (c) => c.id === data.course || data.categories?.includes(c.name),
    );
    if (!course) throw Error(`Unknown course: ${file}`);
    return {
      id:
        data.slug ||
        `${course.id}-${chapter(data.title) === 99 ? path.basename(file, ".md") : chapter(data.title)}`,
      title: data.title,
      course: course.id,
      year: course.year || 1,
      date: data.date ? new Date(data.date).toISOString().slice(0, 10) : null,
      source: file,
      chapter: chapter(data.title),
      ...compile(content),
    };
  })
  .sort(
    (a, b) =>
      courses.findIndex((c) => c.id === a.course) -
        courses.findIndex((c) => c.id === b.course) || a.chapter - b.chapter,
  );
const thoughts = fs
  .readdirSync(path.join(root, "content/thoughts"))
  .filter((f) => f.endsWith(".md"))
  .flatMap((file) => {
    const { data, content } = matter(
      fs.readFileSync(path.join(root, "content/thoughts", file), "utf8"),
    );
    if (data.draft) return [];
    return [
      {
        id: path.basename(file, ".md"),
        title: data.title,
        date: data.date ? new Date(data.date).toISOString().slice(0, 10) : null,
        sample: !!data.sample,
        ...compile(content),
      },
    ];
  })
  .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
if (new Set(projects.map((p) => p.id)).size !== projects.length)
  throw Error("Duplicate article id: set a unique slug in frontmatter.");
const out = path.join(root, "public/content");
fs.mkdirSync(out, { recursive: true });
for (const p of projects) {
  fs.writeFileSync(
    path.join(out, `${p.id}.json`),
    JSON.stringify({ html: p.html, toc: p.toc }),
  );
  delete p.html;
  delete p.toc;
}
fs.writeFileSync(
  path.join(root, "src/content.json"),
  JSON.stringify({ courses, projects, thoughts }),
);
fs.writeFileSync(path.join(root, "public/.nojekyll"), "");
console.log(
  `Compiled ${projects.length} articles / ${courses.length} courses / ${thoughts.length} thoughts. Math warnings: ${issues.length}`,
);
if (issues.length) console.log([...new Set(issues)].join("\n"));
