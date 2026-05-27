import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://villa9e.app';
  const now  = new Date();

  const publicRoutes = [
    { url: base, priority: 1.0, changeFrequency: 'daily' as const },
    { url: `${base}/login`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${base}/signup`, priority: 0.9, changeFrequency: 'monthly' as const },
    { url: `${base}/privacy`, priority: 0.3, changeFrequency: 'yearly' as const },
    { url: `${base}/terms`, priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  const appRoutes = [
    '/village/map',
    '/village/workshop',
    '/village/dreamline',
    '/village/spirit',
    '/village/zen',
    '/village/tribes',
    '/village/bank',
    '/village/trading-post',
    '/village/hospital',
    '/village/spaces',
    '/leaderboard',
  ].map(path => ({
    url: `${base}${path}`,
    priority: 0.6,
    changeFrequency: 'weekly' as const,
  }));

  return [...publicRoutes, ...appRoutes].map(r => ({
    ...r,
    lastModified: now,
  }));
}
