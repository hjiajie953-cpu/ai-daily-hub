import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

// ─── Configuration ───────────────────────────────────────────
const SEARCH_API_URL =
  process.env.SEARCH_API_URL || "https://api.brave.com/search";
const SEARCH_API_KEY = process.env.SEARCH_API_KEY;
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_API_URL =
  process.env.LLM_API_URL || "https://api.anthropic.com/v1/messages";

const REPO_ROOT = join(import.meta.dirname, "..");
const CONTENTS_DIR = join(REPO_ROOT, "src", "content", "news");

// Category definitions: each has search queries in EN + ZH for bilingual coverage.
// Content files all go into the single "news" collection directory; the `category`
// field in frontmatter distinguishes sections.
const CATEGORIES = {
  "ai-news": {
    queries: [
      "AI news today artificial intelligence breakthroughs",
      "人工智能 大模型 最新消息 2026",
    ],
  },
  "ai-film": {
    queries: [
      "AI video tools filmmaking Sora Runway news",
      "AI影视 人工智能视频 剪辑 生成",
    ],
  },
  tech: {
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
    headers: {
      "X-Subscription-Token": SEARCH_API_KEY,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Search API returned ${res.status}: ${res.statusText}`);
  }
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
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API returned ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  const date = todayISO();
  console.log(`[generate-daily] Generating content for ${date}`);

  if (!SEARCH_API_KEY) {
    console.error("ERROR: SEARCH_API_KEY environment variable is not set.");
    process.exit(1);
  }
  if (!LLM_API_KEY) {
    console.error("ERROR: LLM_API_KEY environment variable is not set.");
    process.exit(1);
  }

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
      return `## ${cat}\n${items
        .map(
          (r, i) =>
            `[${i + 1}] ${r.title}\n   URL: ${r.url}\n   摘要: ${r.snippet}`,
        )
        .join("\n")}`;
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

  // 3. Write Markdown files into the single "news" collection directory
  mkdirSync(CONTENTS_DIR, { recursive: true });

  for (const entry of parsed) {
    const slug = slugify(entry.title);
    const filename = `${date}-${slug}.md`;
    const filepath = join(CONTENTS_DIR, filename);

    const sourcesYaml = entry.sources
      .map((s) => `  - name: "${s.name}"\n    url: ${s.url}`)
      .join("\n");
    const tagsYaml = `[${entry.tags.map((t) => `"${t}"`).join(", ")}]`;

    const content = `---
title: "${entry.title.replace(/"/g, '\\"')}"
date: ${date}
category: ${entry.category}
rank: ${entry.rank}
tags: ${tagsYaml}
sources:
${sourcesYaml}
summary: "${entry.summary.replace(/"/g, '\\"')}"
---

## 详情

${entry.body}

## 来源

${entry.sources.map((s) => `- [${s.name}](${s.url})`).join("\n")}
`;

    writeFileSync(filepath, content, "utf-8");
    console.log(`  Wrote: ${filename}`);
  }

  // 4. Git commit & push (runs from repo root)
  console.log("  Committing and pushing...");
  try {
    execSync("git add src/content/", { cwd: REPO_ROOT });
    execSync(`git commit -m "content: daily update ${date}"`, {
      cwd: REPO_ROOT,
    });
    execSync("git push", { cwd: REPO_ROOT });
    console.log("  Done! Pushed to remote.");
  } catch (e) {
    console.error("  Git error:", e.message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
