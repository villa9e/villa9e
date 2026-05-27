import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/signup', '/privacy', '/terms'],
        disallow: ['/village/', '/admin/', '/api/', '/onboarding/'],
      },
    ],
    sitemap: 'https://villa9e.app/sitemap.xml',
  };
}
