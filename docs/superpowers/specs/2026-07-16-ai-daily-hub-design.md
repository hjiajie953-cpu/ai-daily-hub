# AI Daily Hub — 设计规格书

**日期：** 2026-07-16
**状态：** 已确认

---

## 1. 项目概述

构建一个纯静态内容聚合网站，每日自动推送三类内容：
- **AI 事件** — AI 大模型发布、行业动态、政策监管
- **AI+影视** — AI 视频工具、影视行业AI应用、AI生成影视作品
- **科技事件** — 科技公司动态、硬件发布、行业趋势

内容通过 GitHub Actions 定时触发脚本自动抓取 + LLM 总结生成，存入 Markdown 文件，Astro 构建为静态站点部署。

---

## 2. 技术选型

| 层 | 选择 | 理由 |
|----|------|------|
| 框架 | Astro 5 | 内容站点首选，Markdown 原生支持，零 JS 开销 |
| 样式 | Tailwind CSS 4 | 快速开发，响应式，深色主题 |
| 部署 | Vercel (免费) | Astro 一等公民，自动构建 |
| 定时任务 | GitHub Actions | 免费，每天定时触发 |
| 内容脚本 | Node.js + 搜索 API + LLM API | 抓取、翻译、分类、生成 |
| 内容存储 | Markdown 文件 (`src/content/`) | 文件即数据库，Git 可追溯 |

---

## 3. 架构

```
GitHub Actions (cron: 每天 08:00 CST)
    │
    ▼
Node.js 内容生成脚本
    │  ① 搜索 API 抓取当日 AI/科技新闻
    │  ② 调用 LLM 筛选、总结、翻译成中文、按板块分类
    │  ③ 输出含 frontmatter 的 Markdown 文件
    │
    ▼
src/content/{ai-news,ai-film,tech}/YYYY-MM-DD-slug.md
    │
    ▼
Astro 构建 → Vercel 部署
```

无数据库、无后端服务器、无运行时依赖。全部文件驱动。

---

## 4. 页面结构

```
/                    首页 — 今日概览 + 时间线混合流
/ai-news             板块页 — AI事件按日分组
/ai-film             板块页 — AI+影视按日分组
/tech                板块页 — 科技事件按日分组
/archive             归档页 — 日历视图历史回溯
```

- 首页顶部 3 张概览卡片（今日三板块各一条头条）
- 下方时间线混合流（所有条目按 rank 排序，标签区分板块）
- 板块页仅显示对应 category 的内容，按日期分组
- 归档页提供日历导航，点击日期展开当日内容

---

## 5. 内容条目格式

```markdown
---
title: "标题"
date: 2026-07-16
category: ai-news       # ai-news | ai-film | tech
rank: 1                  # 当日排序
tags: [标签1, 标签2]
sources:
  - name: 来源名
    url: https://...
summary: 一句话摘要
---

## 详情

正文内容...

## 来源

- [来源名](https://...)
```

---

## 6. 视觉设计

- **配色：** 深色背景 (#0f0f0f)，卡片 (#1e1e1e)，文字 (#e0e0e0)，强调色青绿渐变
- **板块色标：** AI事件=蓝紫、AI+影视=橙、科技=青
- **字体：** 系统字体栈，中文优先 PingFang SC
- **布局：** 响应式（移动端/平板/桌面），卡片网格自适应
- **交互：** 顶部导航 sticky，卡片 hover 微上浮，无花哨动画
- **不支持亮色切换** — 专注深色阅读体验

---

## 7. 内容生成脚本设计

脚本位置：`scripts/generate-daily.js`

流程：
1. 读取当天日期
2. 并行调用搜索 API（3个板块各 2-3 个搜索词）
3. 去重 URL，取 Top 15 条结果
4. 调用 LLM：总结、翻译成中文、按板块分类、按重要性排序
5. 每个板块输出 3-5 条 Markdown 文件
6. 写入 `src/content/<category>/YYYY-MM-DD-slug.md`
7. Git commit + push → 触发 Vercel 自动部署

---

## 8. API 依赖

| 用途 | 备选 | 
|------|------|
| 新闻搜索 | SerpAPI / Brave Search API / Bing News API |
| 内容生成 | Claude API / OpenAI API |

用环境变量管理 API Key，GitHub Secrets 存储。

---

## 9. 非功能需求

- **性能：** Lighthouse 评分 90+，首屏 < 2s
- **SEO：** 每个页面独立 title/description，sitemap 自动生成
- **维护：** 零运维，全自动，只在 API 配额耗尽时需要人工介入
- **扩展：** 新增板块只需在 `src/content/` 下新建目录 + 导航加一条链接

---

## 10. 不做的

- 用户登录/注册
- 评论系统
- 搜索功能（首版用浏览器搜索代替）
- RSS 订阅输出（v2 可考虑）
- 邮件/消息推送
- i18n / 多语言
