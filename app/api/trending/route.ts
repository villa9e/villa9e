import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude/client';

// Curated trending goal categories with real-world alignment
const GOAL_CATEGORIES = [
  'Start a business', 'Learn to code', 'Get fit and lose weight',
  'Pay off debt', 'Learn a new skill', 'Travel more',
  'Write a book', 'Invest in stocks', 'Eat healthier',
  'Quit a bad habit', 'Start a podcast', 'Build an emergency fund',
  'Go back to school', 'Get a promotion', 'Learn a language',
  'Buy a house', 'Start freelancing', 'Meditate daily',
];

// Cache for 6 hours to avoid hitting Claude too frequently
let cachedTrending: any[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (cachedTrending && now - cacheTime < CACHE_TTL) {
    return NextResponse.json(cachedTrending);
  }

  try {
    const month = new Date().toLocaleString('en-US', { month: 'long' });
    const year  = new Date().getFullYear();

    const prompt = `It's ${month} ${year}. Based on current real-world trends, cultural moments, and what people are actually working toward right now, generate 8 trending goal topics.

Each should be specific (not generic), timely, and feel relevant to someone in their 20s–40s building a better life.

Return JSON array only:
[
  {"title": "...", "category": "...", "emoji": "...", "momentum": "rising|hot|steady", "context": "one short sentence on why it's trending now"},
  ...
]

Categories: Business, Health, Finance, Education, Creative, Personal, Career, Relationships`;

    const result = await callClaude(prompt);
    const trending = Array.isArray(result) ? result : GOAL_CATEGORIES.slice(0, 8).map((t, i) => ({
      title: t, category: 'Personal', emoji: '📍', momentum: 'steady', context: 'A perennial goal people work toward.',
    }));

    cachedTrending = trending;
    cacheTime = now;
    return NextResponse.json(trending);
  } catch {
    return NextResponse.json(GOAL_CATEGORIES.slice(0, 8).map(t => ({
      title: t, category: 'Personal', emoji: '📍', momentum: 'steady', context: '',
    })));
  }
}
