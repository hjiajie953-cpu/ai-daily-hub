# AI Daily Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static-content news aggregation website with automated daily content generation via GitHub Actions.

**Architecture:** Astro 5 static site with Tailwind CSS 4, content stored as Markdown files with frontmatter in `src/content/`. A Node.js script fetches news via search API, summarizes with LLM, and writes Markdown files. GitHub Actions triggers the script daily; Vercel auto-deploys on push.

**Tech Stack:** Astro 5, Tailwind CSS 4, Node.js (for content generation script), Vercel (hosting), GitHub Actions (scheduling)

## Global Constraints

- Node.js >= 20
- Package manager: pnpm
- All content in Chinese
- Dark theme only (background #0f0f0f, cards #1e1e1e, text #e0e0e0)
- Category colors: ai-news=#7c5ce7, ai-film=#f59e0b, tech=#00d4aa
- No user auth, no comments, no DB, no runtime server
- Responsive: mobile / tablet / desktop

---

## File Structure

```
ai-daily-hub/
├── src/
│   ├── content/
│   │   ├── ai-news/              # AI事件 — Markdown posts
│   │   ├── ai-film/              # AI+影视 — Markdown posts
│   │   └── tech/                 # 科技事件 — Markdown posts
│   ├── content.config.ts         # Astro content collections schema
│   ├── layouts/
│   │   └── BaseLayout.astro      # Global shell: <html>, nav, footer
│   ├── pages/
│   │   ├── index.astro           # Homepage: 3 hero cards + timeline
│   │   ├── ai-news.astro         # AI事件 section: all ai-news posts by date
│   │   ├── ai-film.astro         # AI+影视 section: all ai-film posts by date
│   │   ├── tech.astro            # 科技 section: all tech posts by date
│   │   └── archive.astro         # Calendar-picker archive
│   ├── components/
│   │   ├── Nav.astro             # Sticky top nav with category links
│   │   ├── NewsCard.astro        # Single news card (used everywhere)
│   │   ├── HeroCards.astro       # 3-card row for homepage top
│   │   ├── Timeline.astro        # Mixed-category stream for homepage
│   │   ├── Calendar.astro        # Calendar grid for archive page
│   │   └── CategoryBadge.astro   # Colored pill: AI事件 | AI+影视 | 科技
│   └── styles/
│       └── global.css            # Tailwind imports + custom properties
├── scripts/
│   └── generate-daily.js         # Fetch → LLM → write Markdown → commit
├── public/
│   └── favicon.svg
├── astro.config.mjs
├── package.json
├── .gitignore
└── .github/
    └── workflows/
        └── daily-generate.yml    # Cron: 0 0 * * * (UTC, = 08:00 CST)
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `src/styles/global.css`
- Create: `public/favicon.svg`

**Interfaces:**
- Produces: Runnable `astro dev` with Tailwind, base styles loaded

- [ ] **Step 1: Create package.json**

```json
{
  "name": "ai-daily-hub",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "generate": "node scripts/generate-daily.js"
  },
  "dependencies": {
    "astro": "^5.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

- [ ] **Step 2: Create astro.config.mjs**

```js
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://ai-daily-hub.vercel.app",
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strictNullChecks": true,
    "allowJs": true
  }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
```

- [ ] **Step 5: Create src/styles/global.css**

```css
@import "tailwindcss";

@theme {
  --color-bg: #0f0f0f;
  --color-surface: #1e1e1e;
  --color-text: #e0e0e0;
  --color-text-dim: #888888;
  --color-accent-start: #00d4aa;
  --color-accent-end: #00a8ff;
  --color-cat-ai: #7c5ce7;
  --color-cat-film: #f59e0b;
  --color-cat-tech: #00d4aa;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, -apple-system, sans-serif;
}
```

- [ ] **Step 6: Create public/favicon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0f0f0f"/>
  <text x="16" y="23" text-anchor="middle" font-size="20">📰</text>
</svg>
```

- [ ] **Step 7: Install dependencies and verify dev server starts**

```bash
cd /Users/kjfh/ai-daily-hub && pnpm install && pnpm astro dev --host 0.0.0.0
```
Expected: dev server starts without errors. Kill after confirming.

- [ ] **Step 8: Commit**

```bash
cd /Users/kjfh/ai-daily-hub && git init && git add -A && git commit -m "feat: scaffold Astro 5 project with Tailwind CSS 4"
```

---

### Task 2: Content Collection Schema

**Files:**
- Create: `src/content.config.ts`

**Interfaces:**
- Consumes: Astro project structure from Task 1
- Produces: `collections.news` — typed content collection available in all pages

- [ ] **Step 1: Create src/content.config.ts**

```ts
import { defineCollection, z } from "astro:content";

const newsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    category: z.enum(["ai-news", "ai-film", "tech"]),
    rank: z.number().min(1).max(20),
    tags: z.array(z.string()).default([]),
    sources: z.array(
      z.object({
        name: z.string(),
        url: z.string().url(),
      })
    ).default([]),
    summary: z.string(),
  }),
});

export const collections = {
  news: newsCollection,
};
```

- [ ] **Step 2: Verify schema compiles**

```bash
cd /Users/kjfh/ai-daily-hub && pnpm astro check 2>&1 || pnpm astro build --dry-run 2>&1
```
Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/kjfh/ai-daily-hub && git add -A && git commit -m "feat: define news content collection schema"
```

---

### Task 3: Global Layout + Navigation + Footer

**Files:**
- Create: `src/components/Nav.astro`
- Create: `src/components/CategoryBadge.astro`
- Create: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Produces: `<BaseLayout title="..." description="...">` wrapper, `<Nav />`, `<CategoryBadge category="ai-news" />`

- [ ] **Step 1: Create src/components/CategoryBadge.astro**

```astro
---
export interface Props {
  category: "ai-news" | "ai-film" | "tech";
}

const categoryMeta = {
  "ai-news": { label: "AI事件", color: "var(--color-cat-ai)" },
  "ai-film": { label: "AI+影视", color: "var(--color-cat-film)" },
  "tech": { label: "科技", color: "var(--color-cat-tech)" },
};

const { label, color } = categoryMeta[Astro.props.category];
---

<span
  class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
  style={`background-color: ${color}22; color: ${color}; border: 1px solid ${color}44`}
>
  {label}
</span>
```

- [ ] **Step 2: Create src/components/Nav.astro**

```astro
---
const links = [
  { href: "/", label: "首页" },
  { href: "/ai-news", label: "AI事件" },
  { href: "/ai-film", label: "AI+影视" },
  { href: "/tech", label: "科技" },
  { href: "/archive", label: "往期归档" },
];
const currentPath = Astro.url.pathname;
---

<nav class="sticky top-0 z-50 backdrop-blur-md border-b border-white/10" style="background-color: rgba(15, 15, 15, 0.85);">
  <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
    <a href="/" class="text-lg font-bold bg-gradient-to-r from-[var(--color-accent-start)] to-[var(--color-accent-end)] bg-clip-text text-transparent">
      AI Daily Hub
    </a>
    <div class="flex gap-1">
      {links.map((link) => (
        <a
          href={link.href}
          class={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            currentPath === link.href
              ? "bg-white/10 text-white"
              : "text-[var(--color-text-dim)] hover:text-white hover:bg-white/5"
          }`}
        >
          {link.label}
        </a>
      ))}
    </div>
  </div>
</nav>
```

- [ ] **Step 3: Create src/layouts/BaseLayout.astro**

```astro
---
export interface Props {
  title: string;
  description?: string;
}

const { title, description = "AI Daily Hub — 每日AI与科技新闻聚合" } = Astro.props;
---

<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} | AI Daily Hub</title>
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
    <Nav />
    <main class="max-w-5xl mx-auto px-4 py-8">
      <slot />
    </main>
    <footer class="border-t border-white/10 py-6 mt-12">
      <div class="max-w-5xl mx-auto px-4 text-center text-sm text-[var(--color-text-dim)]">
        <p>AI Daily Hub — 每日自动聚合 AI 与科技要闻</p>
      </div>
    </footer>
  </body>
</html>
```

- [ ] **Step 4: Verify the layout renders**

```bash
cd /Users/kjfh/ai-daily-hub && pnpm astro dev 2>&1 &
sleep 3 && curl -s http://localhost:4321/ | head -20
```
Expected: HTML with nav and footer. Kill the dev server after.

- [ ] **Step 5: Commit**

```bash
cd /Users/kjfh/ai-daily-hub && git add -A && git commit -m "feat: add Nav, CategoryBadge, and BaseLayout"
```

---

### Task 4: Homepage — Hero Cards + Timeline

**Files:**
- Create: `src/components/HeroCards.astro`
- Create: `src/components/NewsCard.astro`
- Create: `src/components/Timeline.astro`
- Create: `src/pages/index.astro`

**Interfaces:**
- Consumes: `getCollection("news")` from content config
- Produces: `/` route — 3 hero cards (today's top per category) + today's full timeline

- [ ] **Step 1: Create src/components/NewsCard.astro**

```astro
---
import CategoryBadge from "./CategoryBadge.astro";
import type { CollectionEntry } from "astro:content";

export interface Props {
  post: CollectionEntry<"news">;
  featured?: boolean;
}

const { post, featured = false } = Astro.props;
const { title, date, category, summary, sources } = post.data;
const href = `/archive#${date.toISOString().split("T")[0]}`;
---

<article
  class={`group rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 ${
    featured ? "ring-1 ring-white/10" : ""
  }`}
  style="background-color: var(--color-surface);"
>
  <div class="flex items-center gap-2 mb-2">
    <CategoryBadge category={category} />
    <time class="text-xs text-[var(--color-text-dim)]" datetime={date.toISOString().split("T")[0]}>
      {date.toISOString().split("T")[0]}
    </time>
  </div>
  <h3 class={`font-bold mb-2 group-hover:text-[var(--color-accent-start)] transition-colors ${featured ? "text-lg" : "text-base"}`}>
    <a href={href}>{title}</a>
  </h3>
  <p class="text-sm text-[var(--color-text-dim)] leading-relaxed">{summary}</p>
  {sources.length > 0 && (
    <div class="mt-3 flex flex-wrap gap-2">
      {sources.map((s) => (
        <a href={s.url} target="_blank" rel="noopener" class="text-xs text-[var(--color-accent-start)] hover:underline">
          {s.name}
        </a>
      ))}
    </div>
  )}
</article>
```

- [ ] **Step 2: Create src/components/HeroCards.astro**

```astro
---
import NewsCard from "./NewsCard.astro";
import type { CollectionEntry } from "astro:content";

export interface Props {
  posts: CollectionEntry<"news">[];
}

const { posts } = Astro.props;
const categories = ["ai-news", "ai-film", "tech"] as const;
const topPosts = categories
  .map((cat) => posts.filter((p) => p.data.category === cat).sort((a, b) => a.data.rank - b.data.rank)[0])
  .filter(Boolean);
---

<section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
  {topPosts.map((post) => (
    <NewsCard post={post} featured={true} />
  ))}
</section>
```

- [ ] **Step 3: Create src/components/Timeline.astro**

```astro
---
import NewsCard from "./NewsCard.astro";
import type { CollectionEntry } from "astro:content";

export interface Props {
  posts: CollectionEntry<"news">[];
}

const { posts } = Astro.props;
const sorted = [...posts].sort((a, b) => {
  if (a.data.date.getTime() !== b.data.date.getTime()) {
    return b.data.date.getTime() - a.data.date.getTime();
  }
  return a.data.rank - b.data.rank;
});
---

<section class="space-y-4">
  <h2 class="text-xl font-bold mb-4">📋 今日全览</h2>
  {sorted.map((post) => (
    <NewsCard post={post} />
  ))}
</section>
```

- [ ] **Step 4: Create src/pages/index.astro**

```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../layouts/BaseLayout.astro";
import HeroCards from "../components/HeroCards.astro";
import Timeline from "../components/Timeline.astro";

const allPosts = await getCollection("news");
const today = new Date().toISOString().split("T")[0];
const todayPosts = allPosts.filter(
  (p) => p.data.date.toISOString().split("T")[0] === today
);
---

<BaseLayout title="首页" description="AI Daily Hub — 每日AI与科技新闻聚合">
  {todayPosts.length > 0 ? (
    <>
      <HeroCards posts={todayPosts} />
      <Timeline posts={todayPosts} />
    </>
  ) : (
    <div class="text-center py-20">
      <h2 class="text-2xl font-bold mb-4">今日内容正在生成中...</h2>
      <p class="text-[var(--color-text-dim)]">每天上午 8:00 自动更新，请稍后再来。</p>
      <p class="text-[var(--color-text-dim)] mt-2">也可以先浏览 <a href="/archive" class="text-[var(--color-accent-start)] underline">往期内容</a></p>
    </div>
  )}
</BaseLayout>
```

- [ ] **Step 5: Verify homepage builds**

```bash
cd /Users/kjfh/ai-daily-hub && pnpm astro build 2>&1
```
Expected: build succeeds (empty content collections are fine).

- [ ] **Step 6: Commit**

```bash
cd /Users/kjfh/ai-daily-hub && git add -A && git commit -m "feat: add homepage with hero cards and timeline"
```

---

### Task 5: Section Pages — AI事件, AI+影视, 科技

**Files:**
- Create: `src/pages/ai-news.astro`
- Create: `src/pages/ai-film.astro`
- Create: `src/pages/tech.astro`

**Interfaces:**
- Consumes: `getCollection("news")` filtered by category
- Produces: `/ai-news`, `/ai-film`, `/tech` — posts grouped by date, newest first

- [ ] **Step 1: Create src/pages/ai-news.astro**

```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../layouts/BaseLayout.astro";
import NewsCard from "../components/NewsCard.astro";

const posts = await getCollection("news", ({ data }) => data.category === "ai-news");
const grouped = new Map<string, typeof posts>();
for (const post of posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())) {
  const key = post.data.date.toISOString().split("T")[0];
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key)!.push(post);
}
---

<BaseLayout title="AI事件" description="每日AI大模型、行业动态、政策监管">
  <h1 class="text-3xl font-bold mb-2">🤖 AI事件</h1>
  <p class="text-[var(--color-text-dim)] mb-8">AI大模型发布、行业动态、政策监管</p>

  {[...grouped.entries()].map(([date, dayPosts]) => (
    <section class="mb-10">
      <h2 class="text-lg font-bold mb-4 text-[var(--color-cat-ai)] border-l-4 border-[var(--color-cat-ai)] pl-3" id={date}>
        {date}
      </h2>
      <div class="space-y-3">
        {dayPosts.sort((a, b) => a.data.rank - b.data.rank).map((post) => (
          <NewsCard post={post} />
        ))}
      </div>
    </section>
  ))}
</BaseLayout>
```

- [ ] **Step 2: Create src/pages/ai-film.astro**

```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../layouts/BaseLayout.astro";
import NewsCard from "../components/NewsCard.astro";

const posts = await getCollection("news", ({ data }) => data.category === "ai-film");
const grouped = new Map<string, typeof posts>();
for (const post of posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())) {
  const key = post.data.date.toISOString().split("T")[0];
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key)!.push(post);
}
---

<BaseLayout title="AI+影视" description="AI视频工具、影视行业AI应用、AI生成影视">
  <h1 class="text-3xl font-bold mb-2">🎬 AI+影视</h1>
  <p class="text-[var(--color-text-dim)] mb-8">AI视频工具、影视行业AI应用、AI生成影视作品</p>

  {[...grouped.entries()].map(([date, dayPosts]) => (
    <section class="mb-10">
      <h2 class="text-lg font-bold mb-4 text-[var(--color-cat-film)] border-l-4 border-[var(--color-cat-film)] pl-3" id={date}>
        {date}
      </h2>
      <div class="space-y-3">
        {dayPosts.sort((a, b) => a.data.rank - b.data.rank).map((post) => (
          <NewsCard post={post} />
        ))}
      </div>
    </section>
  ))}
</BaseLayout>
```

- [ ] **Step 3: Create src/pages/tech.astro**

```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../layouts/BaseLayout.astro";
import NewsCard from "../components/NewsCard.astro";

const posts = await getCollection("news", ({ data }) => data.category === "tech");
const grouped = new Map<string, typeof posts>();
for (const post of posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())) {
  const key = post.data.date.toISOString().split("T")[0];
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key)!.push(post);
}
---

<BaseLayout title="科技" description="科技公司动态、硬件发布、行业趋势">
  <h1 class="text-3xl font-bold mb-2">🔧 科技</h1>
  <p class="text-[var(--color-text-dim)] mb-8">科技公司动态、硬件发布、行业趋势</p>

  {[...grouped.entries()].map(([date, dayPosts]) => (
    <section class="mb-10">
      <h2 class="text-lg font-bold mb-4 text-[var(--color-cat-tech)] border-l-4 border-[var(--color-cat-tech)] pl-3" id={date}>
        {date}
      </h2>
      <div class="space-y-3">
        {dayPosts.sort((a, b) => a.data.rank - b.data.rank).map((post) => (
          <NewsCard post={post} />
        ))}
      </div>
    </section>
  ))}
</BaseLayout>
```

- [ ] **Step 4: Verify all section pages build**

```bash
cd /Users/kjfh/ai-daily-hub && pnpm astro build 2>&1
```
Expected: build succeeds with all 3 section routes.

- [ ] **Step 5: Commit**

```bash
cd /Users/kjfh/ai-daily-hub && git add -A && git commit -m "feat: add section pages for ai-news, ai-film, and tech"
```

---

### Task 6: Archive Page with Calendar

**Files:**
- Create: `src/components/Calendar.astro`
- Create: `src/pages/archive.astro`

**Interfaces:**
- Consumes: all posts from `getCollection("news")`
- Produces: `/archive` — calendar grid where dates with content are highlighted, click to view

- [ ] **Step 1: Create src/components/Calendar.astro**

```astro
---
import NewsCard from "./NewsCard.astro";
import type { CollectionEntry } from "astro:content";

export interface Props {
  posts: CollectionEntry<"news">[];
}

const { posts } = Astro.props;

// Build a map of date → posts
const postMap = new Map<string, CollectionEntry<"news">[]>();
for (const post of posts) {
  const key = post.data.date.toISOString().split("T")[0];
  if (!postMap.has(key)) postMap.set(key, []);
  postMap.get(key)!.push(post);
}

// Find date range (first post → today)
const dates = [...postMap.keys()].sort();
const today = new Date().toISOString().split("T")[0];
const startDate = dates[0] || today;
const endDate = today;

// Build calendar months
const months: { label: string; weeks: { date: string; hasContent: boolean; isCurrentMonth: boolean }[][] }[] = [];
const cursor = new Date(startDate);
cursor.setDate(1); // start from first of that month

while (cursor.toISOString().split("T")[0] <= endDate) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = `${year}年${month + 1}月`;
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: { date: string; hasContent: boolean; isCurrentMonth: boolean }[][] = [];
  let week: { date: string; hasContent: boolean; isCurrentMonth: boolean }[] = [];

  // fill leading empty cells
  for (let i = 0; i < firstDay; i++) {
    week.push({ date: "", hasContent: false, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    week.push({ date: dateStr, hasContent: postMap.has(dateStr), isCurrentMonth: true });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) {
      week.push({ date: "", hasContent: false, isCurrentMonth: false });
    }
    weeks.push(week);
  }

  months.push({ label: monthLabel, weeks });
  cursor.setMonth(cursor.getMonth() + 1);
}

// Reverse so newest month is first
months.reverse();
---

<div class="space-y-10">
  {months.map((month) => (
    <div>
      <h3 class="text-lg font-bold mb-3">{month.label}</h3>
      <div class="grid grid-cols-7 gap-1 text-center text-sm">
        <span class="text-[var(--color-text-dim)] text-xs py-1">日</span>
        <span class="text-[var(--color-text-dim)] text-xs py-1">一</span>
        <span class="text-[var(--color-text-dim)] text-xs py-1">二</span>
        <span class="text-[var(--color-text-dim)] text-xs py-1">三</span>
        <span class="text-[var(--color-text-dim)] text-xs py-1">四</span>
        <span class="text-[var(--color-text-dim)] text-xs py-1">五</span>
        <span class="text-[var(--color-text-dim)] text-xs py-1">六</span>

        {month.weeks.flat().map((cell) =>
          cell.isCurrentMonth ? (
            <a
              href={cell.hasContent ? `#${cell.date}` : "#"}
              class={`py-2 rounded-md transition-colors ${
                cell.hasContent
                  ? "bg-[var(--color-accent-start)]/20 text-[var(--color-accent-start)] font-bold hover:bg-[var(--color-accent-start)]/30 cursor-pointer"
                  : "text-[var(--color-text-dim)] cursor-default"
              }`}
            >
              {cell.date ? cell.date.split("-")[2] : ""}
            </a>
          ) : (
            <span class="py-2 text-transparent">-</span>
          )
        )}
      </div>
    </div>
  ))}
</div>
```

- [ ] **Step 2: Create src/pages/archive.astro**

```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../layouts/BaseLayout.astro";
import Calendar from "../components/Calendar.astro";
import NewsCard from "../components/NewsCard.astro";

const allPosts = await getCollection("news");
const postMap = new Map<string, typeof allPosts>();
for (const post of allPosts) {
  const key = post.data.date.toISOString().split("T")[0];
  if (!postMap.has(key)) postMap.set(key, []);
  postMap.get(key)!.push(post);
}
const dates = [...postMap.keys()].sort().reverse();
---

<BaseLayout title="往期归档" description="AI Daily Hub — 往期内容归档">
  <h1 class="text-3xl font-bold mb-2">📅 往期归档</h1>
  <p class="text-[var(--color-text-dim)] mb-8">按日期浏览历史内容</p>

  <Calendar posts={allPosts} />

  <div class="mt-12 space-y-10">
    {dates.map((date) => (
      <section id={date}>
        <h2 class="text-lg font-bold mb-4 border-l-4 border-[var(--color-accent-start)] pl-3">{date}</h2>
        <div class="space-y-3">
          {postMap.get(date)!.sort((a, b) => a.data.rank - b.data.rank).map((post) => (
            <NewsCard post={post} />
          ))}
        </div>
      </section>
    ))}
  </div>
</BaseLayout>
```

- [ ] **Step 3: Verify archive page builds**

```bash
cd /Users/kjfh/ai-daily-hub && pnpm astro build 2>&1
```
Expected: build succeeds, `/archive` route generated.

- [ ] **Step 4: Commit**

```bash
cd /Users/kjfh/ai-daily-hub && git add -A && git commit -m "feat: add archive page with calendar view"
```

---

### Task 7: Content Generation Script

**Files:**
- Create: `scripts/generate-daily.js`

**Interfaces:**
- Consumes: `SEARCH_API_KEY`, `LLM_API_KEY` from environment
- Produces: Markdown files in `src/content/{category}/YYYY-MM-DD-slug.md`

- [ ] **Step 1: Create scripts/generate-daily.js**

```js
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

// ─── Configuration ───────────────────────────────────────────
const SEARCH_API_URL = process.env.SEARCH_API_URL || "https://api.brave.com/search";
const SEARCH_API_KEY = process.env.SEARCH_API_KEY;
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_API_URL = process.env.LLM_API_URL || "https://api.anthropic.com/v1/messages";

const CONTENTS_DIR = join(import.meta.dirname, "..", "src", "content");

const CATEGORIES = {
  "ai-news": {
    dir: "ai-news",
    queries: [
      "AI news today artificial intelligence breakthroughs",
      "人工智能 大模型 最新消息 2026",
    ],
  },
  "ai-film": {
    dir: "ai-film",
    queries: [
      "AI video tools filmmaking Sora Runway news",
      "AI影视 人工智能视频 剪辑 生成",
    ],
  },
  tech: {
    dir: "tech",
    queries: [
      "technology news today major announcements",
      "科技新闻 最新动态 2026",
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────────
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function searchNews(query) {
  const url = `${SEARCH_API_URL}?q=${encodeURIComponent(query)}&count=5`;
  const res = await fetch(url, {
    headers: { "X-Subscription-Token": SEARCH_API_KEY, Accept: "application/json" },
  });
  const data = await res.json();
  // Normalize: expect { web: { results: [...] } } or { results: [...] }
  const results = data?.web?.results || data?.results || data?.data || [];
  return results.map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.description || r.snippet || "",
  }));
}

async function callLLM(prompt) {
  const res = await fetch(LLM_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": LLM_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content[0].text;
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  const date = todayISO();
  console.log(`[generate-daily] Generating content for ${date}`);

  // 1. Search all categories in parallel
  const allResults = {};
  for (const [cat, cfg] of Object.entries(CATEGORIES)) {
    console.log(`  Searching: ${cat}`);
    const results = [];
    for (const q of cfg.queries) {
      try {
        const r = await searchNews(q);
        results.push(...r);
      } catch (e) {
        console.error(`  Search error (${q}):`, e.message);
      }
    }
    // Deduplicate by URL
    const seen = new Set();
    allResults[cat] = results.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });
    console.log(`  ${cat}: ${allResults[cat].length} unique results`);
  }

  // 2. Build LLM prompt with all results
  const resultsText = Object.entries(allResults)
    .map(([cat, items]) => {
      return `## ${cat}\n${items.map((r, i) => `[${i + 1}] ${r.title}\n   URL: ${r.url}\n   摘要: ${r.snippet}`).join("\n")}`;
    })
    .join("\n\n");

  const prompt = `你是一个专业的科技新闻编辑。下面是今日搜索到的 AI 和科技新闻。请完成以下任务：

1. 筛选出最重要的新闻（去重、去掉低质量内容）
2. 为每类（ai-news, ai-film, tech）各选出 3-5 条最重要的新闻
3. 翻译成中文，撰写标题和摘要
4. 按重要性排序（rank 1 = 最重要）
5. 输出 JSON 数组，格式如下：

[
  {
    "title": "中文标题",
    "category": "ai-news",
    "rank": 1,
    "tags": ["标签1", "标签2"],
    "sources": [{"name": "来源名", "url": "https://..."}],
    "summary": "一句话中文摘要",
    "body": "详细的新闻内容（200-400字中文）"
  }
]

只输出 JSON 数组，不要其他内容。

${resultsText}`;

  console.log("  Calling LLM to summarize...");
  let parsed;
  try {
    const raw = await callLLM(prompt);
    // Extract JSON array from response
    const match = raw.match(/\[[\s\S]*\]/);
    parsed = JSON.parse(match ? match[0] : raw);
    console.log(`  LLM returned ${parsed.length} entries`);
  } catch (e) {
    console.error("  LLM error:", e.message);
    process.exit(1);
  }

  // 3. Write Markdown files
  for (const entry of parsed) {
    const dir = join(CONTENTS_DIR, CATEGORIES[entry.category]?.dir || entry.category);
    mkdirSync(dir, { recursive: true });

    const slug = slugify(entry.title);
    const filename = `${date}-${slug}.md`;
    const filepath = join(dir, filename);

    const sourcesYaml = entry.sources
      .map((s) => `  - name: "${s.name}"\n    url: ${s.url}`)
      .join("\n");
    const tagsYaml = `[${entry.tags.join(", ")}]`;

    const content = `---
title: "${entry.title}"
date: ${date}
category: ${entry.category}
rank: ${entry.rank}
tags: ${tagsYaml}
sources:
${sourcesYaml}
summary: "${entry.summary}"
---

## 详情

${entry.body}

## 来源

${entry.sources.map((s) => `- [${s.name}](${s.url})`).join("\n")}
`;

    writeFileSync(filepath, content, "utf-8");
    console.log(`  Wrote: ${filename}`);
  }

  // 4. Git commit & push
  console.log("  Committing and pushing...");
  try {
    execSync("git add src/content/", { cwd: join(import.meta.dirname, "..") });
    execSync(`git commit -m "content: daily update ${date}"`, { cwd: join(import.meta.dirname, "..") });
    execSync("git push", { cwd: join(import.meta.dirname, "..") });
    console.log("  Done! Pushed to remote.");
  } catch (e) {
    console.error("  Git error:", e.message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Verify script is valid JS**

```bash
cd /Users/kjfh/ai-daily-hub && node --check scripts/generate-daily.js 2>&1
```
Expected: no syntax errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/kjfh/ai-daily-hub && git add -A && git commit -m "feat: add daily content generation script"
```

---

### Task 8: GitHub Actions Daily Workflow

**Files:**
- Create: `.github/workflows/daily-generate.yml`

**Interfaces:**
- Trigger: cron daily at 00:00 UTC (= 08:00 CST)
- Action: run `pnpm generate`, which writes Markdown, commits, and pushes
- Push triggers Vercel auto-deploy

- [ ] **Step 1: Create .github/workflows/daily-generate.yml**

```yaml
name: Daily Content Generation

on:
  schedule:
    # 00:00 UTC = 08:00 CST
    - cron: "0 0 * * *"
  workflow_dispatch:  # allows manual trigger from GitHub UI

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GH_PAT || secrets.GITHUB_TOKEN }}

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - name: Generate daily content
        run: pnpm generate
        env:
          SEARCH_API_KEY: ${{ secrets.SEARCH_API_KEY }}
          LLM_API_KEY: ${{ secrets.LLM_API_KEY }}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kjfh/ai-daily-hub && git add -A && git commit -m "feat: add GitHub Actions daily workflow"
```

---

### Task 9: Seed Content, Sitemap & Final Polish

**Files:**
- Create: `src/content/ai-news/2026-07-16-apple-intelligence-china.md` (sample)
- Create: `src/content/ai-film/2026-07-16-gpt56-math.md` (sample)
- Create: `src/content/tech/2026-07-16-nvidia-vera-rubin.md` (sample)
- Modify: `astro.config.mjs` (add sitemap)

**Interfaces:**
- Produces: runnable site with sample content, sitemap.xml

- [ ] **Step 1: Install @astrojs/sitemap**

```bash
cd /Users/kjfh/ai-daily-hub && pnpm add @astrojs/sitemap
```

- [ ] **Step 2: Update astro.config.mjs to include sitemap**

```js
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://ai-daily-hub.vercel.app",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 3: Create sample content — ai-news**

Create `src/content/ai-news/2026-07-16-apple-intelligence-china.md`:

```markdown
---
title: "Apple Intelligence 正式通过中国监管备案，阿里百度联手入华"
date: 2026-07-16
category: ai-news
rank: 1
tags: [Apple, 阿里巴巴, 百度, 大模型, 监管]
sources:
  - name: TechCrunch
    url: https://techcrunch.com/2026/07/15/apple-intelligence-approved-for-launch-in-china-with-alibabas-qwen-ai/
  - name: Yahoo Finance
    url: https://finance.yahoo.com/technology/ai/articles/apple-intelligence-approved-china-alibaba-131501096.html
summary: "苹果Apple Intelligence通过中国监管备案，阿里巴巴千问大模型和百度文心大模型成为合作伙伴，即将在中国市场发布。"
---

## 详情

7月15日，苹果公司的Apple Intelligence人工智能服务正式通过中国监管备案，扫清了进入中国市场的最关键障碍。此次合作中，阿里巴巴的千问（Qwen）大模型和百度的文心大模型将成为苹果在中国的AI合作伙伴，为iPhone用户提供本地化的AI功能。

消息公布后，阿里巴巴港股当日涨超5%，创逾一个月新高。百度股价也随之上涨。这标志着苹果AI服务全球化布局取得了关键突破，同时也意味着中国AI大模型企业获得了重要的商业落地场景。

据悉，已有7款手机端侧大模型获得备案，苹果Apple Intelligence在列，阿里巴巴和百度提供底层模型支持。中国网信办同时发布了新的AI安全评估标准，进一步加强了对生成式AI的监管。

## 来源

- [TechCrunch](https://techcrunch.com/2026/07/15/apple-intelligence-approved-for-launch-in-china-with-alibabas-qwen-ai/)
- [Yahoo Finance](https://finance.yahoo.com/technology/ai/articles/apple-intelligence-approved-china-alibaba-131501096.html)
- [证券时报](https://stcn.com/article/detail/4021913.html)
```

- [ ] **Step 4: Create sample content — ai-film**

Create `src/content/ai-film/2026-07-16-gpt56-math.md`:

```markdown
---
title: "GPT-5.6 仅用1小时破解50年数学难题，64个AI智能体协作证明"
date: 2026-07-16
category: ai-film
rank: 2
tags: [OpenAI, GPT-5.6, 数学, 图论, 智能体]
sources:
  - name: BAAI智源
    url: https://hub.baai.ac.cn/view/56370
  - name: Donga Science
    url: https://www.dongascience.com/en/news/78959
summary: "OpenAI的GPT-5.6 Sol Ultra仅用1小时证明了困扰数学界50年的循环双覆盖猜想，通过700词Prompt协调64个子Agent完成证明。"
---

## 详情

OpenAI在7月11日宣布了一项震惊数学界的成就：GPT-5.6 Sol Ultra仅用1小时即证明了困扰数学界长达50年的图论难题——循环双覆盖猜想（Cycle Double Cover Conjecture）。

该系统通过仅700词的Prompt，协调64个子Agent协作完成证明过程。每个子Agent负责不同的推理路径和验证任务，最终汇聚成完整的数学证明。此前，GPT-5.6还在90分钟内破解了一个统计学20年悬案，伯克利教授直呼"心塞"。

目前该证明仍需经过严格的同行评审。全球数学家对此反应不一：有人认为这是AI在科学研究领域的里程碑，也有人持谨慎态度，等待验证结果。无论如何，这标志着AI从"聊天工具"迈向"科学发现引擎"的重要一步。

## 来源

- [BAAI智源](https://hub.baai.ac.cn/view/56370)
- [Donga Science](https://www.dongascience.com/en/news/78959)
- [36Kr](https://eu.36kr.com/en/p/3896565258733189)
```

- [ ] **Step 5: Create sample content — tech**

Create `src/content/tech/2026-07-16-nvidia-vera-rubin.md`:

```markdown
---
title: "黄仁勋亲自否认Vera Rubin延期，确认按计划交付"
date: 2026-07-16
category: tech
rank: 3
tags: [英伟达, NVIDIA, Vera Rubin, AI芯片, 黄仁勋]
sources:
  - name: Yahoo Finance
    url: https://ca.finance.yahoo.com/news/nvidia-ceo-huang-denies-vera-151500743.html
  - name: Benzinga
    url: https://www.benzinga.com/markets/tech/26/07/60465814/nvidia-ceo-jensen-huang-dismisses-vera-rubin-hardware-delay-report-affirms-giant-production-volumes
summary: "英伟达CEO黄仁勋公开否认Vera Rubin芯片延期传闻，确认已进入生产阶段，将按计划向客户交付，强调产量巨大。"
---

## 详情

针对近期关于英伟达下一代AI芯片Vera Rubin量产延期的市场传闻，英伟达CEO黄仁勋于7月16日公开予以否认。黄仁勋明确表示，Vera Rubin已进入生产阶段，将按计划向客户交付，并强调"产量巨大"。

Vera Rubin是英伟达继Blackwell之后的下一代AI加速器架构，被市场视为英伟达保持AI芯片霸主地位的关键产品。此前有报道称该芯片因设计问题可能延期，导致英伟达股价出现波动。

分析师指出，若Vera Rubin顺利交付，英伟达股价有62%的上涨空间。同时，英伟达还宣布与日本机器人企业发那科、川崎重工等扩大合作，推动"物理AI"在制造业的应用。

## 来源

- [Yahoo Finance](https://ca.finance.yahoo.com/news/nvidia-ceo-huang-denies-vera-151500743.html)
- [Benzinga](https://www.benzinga.com/markets/tech/26/07/60465814/nvidia-ceo-jensen-huang-dismisses-vera-rubin-hardware-delay-report-affirms-giant-production-volumes)
- [新浪财经](https://finance.sina.com.cn/roll/2026-07-16/doc-inihyiym7944049.shtml)
```

- [ ] **Step 6: Verify full build with content**

```bash
cd /Users/kjfh/ai-daily-hub && pnpm astro build 2>&1
```
Expected: build succeeds with all sample content rendered, sitemap.xml generated.

- [ ] **Step 7: Commit**

```bash
cd /Users/kjfh/ai-daily-hub && git add -A && git commit -m "feat: add sample content, sitemap, and final polish"
```

---

## Self-Review Checklist

- [x] Spec coverage — every requirement mapped to a task
- [x] No placeholders — all code is complete, no TBD/TODO
- [x] Type consistency — `CollectionEntry<"news">` used uniformly, `category` values match across all files
- [x] File paths are exact
- [x] Every step has concrete code or commands
