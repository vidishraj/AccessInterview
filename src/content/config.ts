import { defineCollection, z } from 'astro:content';

const docsCollection = defineCollection({
  type: 'content',
  // schema: z.object({
  //   title: z.string(),
  //   description: z.string(),
  //   pubDate: z.date(),
  //   images: z.array(z.string())
  // })
});

export const collections = {
  docs: docsCollection
}; 
