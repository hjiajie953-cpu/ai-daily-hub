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
