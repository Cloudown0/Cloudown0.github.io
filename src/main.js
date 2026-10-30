import "./style.css";
import "katex/dist/katex.min.css";
import content from "./content.json";
const { courses, projects, thoughts } = content;
const main = document.querySelector("main");
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const arrow = '<span aria-hidden="true">↗</span>';
const image = `${import.meta.env.BASE_URL}assets/Cloudown.png`;
let dispose = () => {};
let first = true;
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const courseBy = (id) => courses.find((c) => c.id === id);
const routeFor = (p) => `#/projects/${p.course}/${p.id}`;
function home() {
  return `
<section class="hero" aria-labelledby="home-title">
 <div class="hero-sticky"><img class="hero-art" src="${image}" alt="" fetchpriority="high"><canvas class="field" aria-hidden="true"></canvas>
 <div class="hero-top"><span>生活 · 探索 · 记录</span><span>Cloudown’s personal space</span></div>
 <h1 id="home-title" class="hero-title"><span>Always</span><em>exploring.</em></h1>
 <div class="hero-bottom"><p>热爱生活的每一种可能，<br>也好奇世界的每一个切面。</p><a href="#intro" class="text-link" data-scroll="intro">向下，遇见更多 <span aria-hidden="true">↓</span></a></div>
 </div>
</section>
<section id="intro" class="intro dark-section"><div class="section-kicker reveal">Hello, I’m Cloudown.</div><h2 class="intro-title reveal">不急着定义自己。<br>先去<span>看见</span>，<br>再去<span>探索</span>。</h2><div class="intro-copy reveal"><p>喜欢把日子过得具体，也喜欢让思绪走得远一点。</p><p>在不同领域之间游走，从一个问题走向另一个问题。这里存放我的学习笔记、零散想法，以及生活里值得留下的片刻。</p><a class="text-link" href="#/about">认识我 ${arrow}</a></div><span class="orbit-word" aria-hidden="true">Curiosity.</span></section>
<section class="home-projects"><div class="section-line reveal"><span>把探索留下来</span><a class="text-link" href="#/projects">全部 Projects ${arrow}</a></div><h2 class="display-title reveal">Learning<br><em>in progress.</em></h2><div class="course-list">${courses.map((c, i) => `<a class="course-row reveal" href="#/projects/${c.id}"><span class="row-index">0${i + 1}</span><div><h3>${escape(c.name)}</h3><p>${c.intro}</p></div><span class="course-count">${projects.filter((p) => p.course === c.id).length} 篇笔记</span>${arrow}</a>`).join("")}</div></section>
<section class="home-thought"><span class="section-kicker reveal">Thoughts & fragments</span><a href="#/thoughts" class="thought-invite reveal"><h2>有些想法，<br><em>不必急着有答案。</em></h2>${arrow}</a><p class="reveal">给日常留一点空白，给好奇留一个入口。</p></section>`;
}
function sidebar(selected, year = 1) {
  return `<aside class="project-sidebar" aria-label="学习目录"><a class="archive-label" href="#/projects">学习档案 <span>↙</span></a>${[
    1, 2,
  ]
    .map(
      (y) =>
        `<details ${year === y ? "open" : ""}><summary>${y === 1 ? "大一" : "大二"} <span>${String(projects.filter((p) => p.year === y).length).padStart(2, "0")}</span></summary><div class="course-nav">${courses
          .filter((c) => c.year === y)
          .map(
            (c) =>
              `<a href="#/projects/${c.id}" ${selected === c.id ? 'aria-current="page"' : ""}>${escape(c.name)}<span>${projects.filter((p) => p.course === c.id).length}</span></a>`,
          )
          .join(
            "",
          )}</div>${y === 2 ? '<a class="year-empty-link" href="#/projects/year-2">查看大二目录 ↗</a>' : ""}</details>`,
    )
    .join(
      "",
    )}<a class="old-blog" href="https://cloudown0.github.io/oldblog/" target="_blank" rel="noopener noreferrer">旧版博客 ${arrow}</a></aside>`;
}

function articleRows(items) {
  return items
    .map(
      (p, i) =>
        `<a class="article-row" href="${routeFor(p)}"><span class="row-index">${String(i + 1).padStart(2, "0")}</span><div><span class="article-course">${escape(courseBy(p.course).name)}</span><h2>${escape(p.title)}</h2><span class="article-meta">${p.date || "日期未记录"} <span>·</span> ${p.readingMinutes} 分钟阅读</span></div>${arrow}</a>`,
    )
    .join("");
}
function projectPage(selected) {
  const course = courseBy(selected);
  const year2 = selected === "year-2" || course?.year === 2;
  const emptyYear2 = year2 && !projects.some((p) => p.year === 2);
  return `<section class="archive-shell">${sidebar(selected, year2 ? 2 : 1)}<div class="archive-main"><div class="page-kicker">Projects <span>/ ${year2 ? "大二" : "大一"}</span></div><h1 class="page-title">${course ? escape(course.name) : year2 ? "下一程。" : "学，然后知。"}</h1><p class="page-description">${year2 ? "新的学年，新的问题。" : course ? course.intro : "从课堂出发，把理解写下来。"}</p>${emptyYear2 ? '<div class="empty-state"><span>02</span><h2>这页，留给接下来的探索。</h2><p>大二的课程笔记将在这里慢慢展开。</p><a class="text-link" href="#/projects">回到大一笔记 ↗</a></div>' : `<div class="archive-tools"><label class="search-label" for="article-search">搜索笔记 <span aria-hidden="true">⌕</span></label><input id="article-search" type="search" placeholder="标题、课程或正文关键词" autocomplete="off"><span id="result-count" role="status"></span></div><div id="article-list"></div>`}</div></section>`;
}
function articlePage(p) {
  return `<div class="reading-progress" aria-hidden="true"></div><section class="archive-shell reading-shell">${sidebar(p.course, p.year)}<div class="article-main"><a class="back-link" href="#/projects/${p.course}">← ${escape(courseBy(p.course).name)}</a><header class="article-header"><p class="page-kicker">${p.year === 2 ? "大二" : "大一"} / ${escape(courseBy(p.course).name)}</p><h1>${escape(p.title)}</h1><p class="article-meta">${p.date || "日期未记录"} <span>·</span> ${p.readingMinutes} 分钟阅读</p></header><details class="article-toc"><summary>文章目录 <span>↓</span></summary><nav aria-label="文章目录">${p.toc.map((h) => `<a class="toc-level-${h.level}" href="#${h.id}" data-scroll="${h.id}">${h.title}</a>`).join("")}</nav></details><article class="prose">${p.html}</article>${articlePager(p)}</div></section>`;
}
function articlePager(p) {
  const all = projects.filter((x) => x.course === p.course),
    index = all.indexOf(p);
  return `<nav class="article-pager" aria-label="相邻文章">${index > 0 ? `<a href="${routeFor(all[index - 1])}"><span>← 上一篇</span>${escape(all[index - 1].title)}</a>` : "<span></span>"}${index < all.length - 1 ? `<a href="${routeFor(all[index + 1])}"><span>下一篇 →</span>${escape(all[index + 1].title)}</a>` : '<a href="#/projects">回到学习档案 ↗</a>'}</nav>`;
}
function thoughtsPage(id) {
  const p = thoughts.find((t) => t.id === id);
  if (id && !p) return notFound();
  return `<section class="thoughts-page"><div class="thoughts-heading"><div class="page-kicker">Thoughts</div><h1 class="display-title">Along<br><em>the way.</em></h1><p>不成体系，也有意义。<br>一些随记，一些正在生长的想法。</p></div>${p ? `<div class="thought-reader"><a class="back-link" href="#/thoughts">← 全部随记</a><span class="thought-date">${p.sample ? "示例随记" : p.date || "随记"}</span><h2>${escape(p.title)}</h2><article class="prose">${p.html}</article></div>` : `<div class="thoughts-feed">${thoughts.length ? thoughts.map((t) => `<article class="thought-entry"><div class="thought-date">${t.sample ? "示例随记" : t.date || "随记"}</div><a href="#/thoughts/${t.id}"><h2>${escape(t.title)}</h2></a><div class="prose">${t.html}</div><a class="text-link" href="#/thoughts/${t.id}">展开这段随记 ${arrow}</a></article>`).join("") : "<p>一些想法，还在路上。</p>"}</div>`}</section>`;
}
function about() {
  return `<section class="about-page"><canvas class="field" aria-hidden="true"></canvas><img src="${image}" alt="" class="about-art"><div class="page-kicker">About / Contact</div><h1 class="about-title">Let’s<br><em>connect.</em></h1><div class="about-bottom"><p>世界很大，<br>很高兴在这里遇见你。</p><a class="contact-link" href="https://github.com/Cloudown0" target="_blank" rel="noopener noreferrer"><span>GitHub</span><strong>@Cloudown0</strong>${arrow}</a></div></section>`;
}
function notFound() {
  return `<section class="not-found"><p>404</p><h1>这条路还没有写下。</h1><a class="text-link" href="#/">回到首页 ↗</a></section>`;
}
let routeVersion = 0;
async function render() {
  const version = ++routeVersion;
  dispose();
  document.body.classList.remove("mobile-directory-open");
  let parts;
  try {
    parts = location.hash
      .replace(/^#\/?/, "")
      .split("/")
      .map(decodeURIComponent);
  } catch {
    parts = ["404"];
  }
  const section = parts[0] || "home";
  let html, title;
  if (section === "home") {
    html = home();
    title = "Always exploring.";
  } else if (section === "projects") {
    const p =
      parts[2] &&
      projects.find((p) => p.id === parts[2] && p.course === parts[1]);
    if (p && !p.html) {
      try {
        const r = await fetch(
          `${import.meta.env.BASE_URL}content/${p.id}.json`,
        );
        if (!r.ok) throw Error("Article unavailable");
        const data = await r.json();
        Object.assign(p, data);
      } catch {
        if (version !== routeVersion) return;
        main.innerHTML =
          '<section class="not-found"><h1>文章暂时未能加载。</h1><p>请检查连接后刷新重试。</p><a class="text-link" href="#/projects">返回学习档案 ↗</a></section>';
        return;
      }
    }
    if (version !== routeVersion) return;
    html = parts[2]
      ? p
        ? articlePage(p)
        : notFound()
      : parts[1] && !courseBy(parts[1]) && parts[1] !== "year-2"
        ? notFound()
        : projectPage(parts[1]);
    title = p ? p.title : "Projects";
  } else if (section === "thoughts") {
    html = thoughtsPage(parts[1]);
    title = "Thoughts";
  } else if (section === "about") {
    html = about();
    title = "About";
  } else {
    html = notFound();
    title = "404";
  }
  main.innerHTML = html;
  document.body.dataset.page = section;
  document.title = `Cloudown — ${title}`;
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === section) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  window.scrollTo({ top: 0, behavior: "instant" });
  if (!first) main.focus({ preventScroll: true });
  first = false;
  const controller = new AbortController();
  const { signal } = controller;
  main.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest("[data-scroll]");
      if (a) {
        e.preventDefault();
        document
          .getElementById(a.dataset.scroll)
          ?.scrollIntoView({
            behavior: reduced.matches ? "instant" : "smooth",
            block: "start",
          });
      }
    },
    { signal },
  );
  const search = document.getElementById("article-search");
  if (search) {
    const all = projects.filter((p) =>
      parts[1] === "year-2"
        ? p.year === 2
        : parts[1]
          ? p.course === parts[1]
          : p.year === 1,
    );
    const filter = () => {
      const q = search.value.trim().toLocaleLowerCase();
      const result = all.filter((p) =>
        `${p.title} ${courseBy(p.course).name} ${p.search}`
          .toLocaleLowerCase()
          .includes(q),
      );
      document.getElementById("article-list").innerHTML = result.length
        ? articleRows(result)
        : '<div class="no-results">没有找到相关笔记，试试其他关键词。</div>';
      document.getElementById("result-count").textContent =
        `${result.length} 篇`;
    };
    filter();
    search.addEventListener("input", filter, { signal });
  }
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.08 },
  );
  main.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  const stopMotion = motion(signal);
  dispose = () => {
    controller.abort();
    observer.disconnect();
    stopMotion();
  };
}
function motion(signal) {
  const canvas = main.querySelector("canvas");
  const hero = main.querySelector(".hero");
  const sticky = main.querySelector(".hero-sticky");
  const introWord = main.querySelector(".orbit-word");
  const progress = main.querySelector(".reading-progress");
  const ctx = canvas?.getContext("2d");
  let w = 0,
    h = 0,
    dpr = 1,
    raf = 0,
    targetX = -1000,
    targetY = -1000,
    x = -1000,
    y = -1000,
    active = true;
  const resize = () => {
    if (!canvas) return;
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const paint = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = "rgba(137,96,20,0.18)";
    const step = w < 700 ? 64 : 88;
    const point = (px, py) => {
      if (reduced.matches || x < 0) return [px, py];
      const dx = px - x,
        dy = py - y,
        d = Math.hypot(dx, dy);
      const force = 22 * Math.exp((-d * d) / 46000);
      return [px + (dx / (d || 1)) * force, py + (dy / (d || 1)) * force];
    };
    for (let col = 0; col <= w + step; col += step) {
      ctx.beginPath();
      for (let yy = 0; yy <= h + step; yy += 22) {
        const p = point(col, yy);
        if (yy === 0) ctx.moveTo(...p);
        else ctx.lineTo(...p);
      }
      ctx.stroke();
    }
    for (let row = 0; row <= h + step; row += step) {
      ctx.beginPath();
      for (let xx = 0; xx <= w + step; xx += 22) {
        const p = point(xx, row);
        if (xx === 0) ctx.moveTo(...p);
        else ctx.lineTo(...p);
      }
      ctx.stroke();
    }
  };
  const scroll = () => {
    const top = scrollY;
    if (hero && !reduced.matches) {
      const p = Math.max(
        0,
        Math.min(1, top / (hero.offsetHeight - innerHeight)),
      );
      sticky.style.setProperty("--hero-progress", p);
      const text = main.querySelector(".hero-title");
      text.style.transform = `translate3d(0,${-p * 80}px,0)`;
      main.querySelector(".hero-art").style.transform =
        `translate3d(0,${p * 90}px,0) scale(${1 + p * 0.12})`;
    }
    if (introWord && !reduced.matches) {
      const rect = introWord.parentElement.getBoundingClientRect();
      introWord.style.transform = `translate3d(${Math.max(-200, Math.min(200, rect.top * 0.15))}px,0,0)`;
    }
    if (progress) {
      const article = main.querySelector(".article-main");
      const start = article.offsetTop,
        end = article.offsetHeight - innerHeight;
      progress.style.transform = `scaleX(${Math.max(0, Math.min(1, (top - start) / Math.max(1, end)))})`;
    }
    document
      .querySelector(".site-header")
      .classList.toggle("scrolled", top > 30);
  };
  const tick = () => {
    raf = 0;
    if (!active || document.hidden || reduced.matches) return;
    const dx = targetX - x,
      dy = targetY - y;
    x += dx * 0.12;
    y += dy * 0.12;
    paint();
    if (Math.abs(dx) + Math.abs(dy) > 0.2) raf = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (!raf && active && !reduced.matches) raf = requestAnimationFrame(tick);
  };
  window.addEventListener(
    "pointermove",
    (e) => {
      if (!canvas || e.pointerType === "touch") return;
      const r = canvas.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      targetX = e.clientX - r.left;
      targetY = e.clientY - r.top;
      if (x < -900) {
        x = targetX;
        y = targetY;
      }
      wake();
    },
    { signal, passive: true },
  );
  window.addEventListener(
    "resize",
    () => {
      resize();
      paint();
      scroll();
    },
    { signal, passive: true },
  );
  window.addEventListener("scroll", scroll, { signal, passive: true });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else {
        raf = 0;
        wake();
      }
    },
    { signal },
  );
  reduced.addEventListener(
    "change",
    () => {
      if (reduced.matches) {
        cancelAnimationFrame(raf);
        raf = 0;
        if (sticky) sticky.style.setProperty("--hero-progress", 0);
        main
          .querySelectorAll(".hero-title,.hero-art,.orbit-word")
          .forEach((el) => (el.style.transform = ""));
      }
      paint();
      scroll();
    },
    { signal },
  );
  resize();
  paint();
  scroll();
  return () => {
    active = false;
    cancelAnimationFrame(raf);
  };
}
document.querySelector(".skip-link").addEventListener("click", (e) => {
  e.preventDefault();
  main.focus();
  main.scrollIntoView({ behavior: "instant" });
});
window.addEventListener("hashchange", render);
render();
