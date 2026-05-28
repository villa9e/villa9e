// Villa9e affiliate product database
// Amazon Associates tag — update AFFILIATE_TAG with your actual tag
const AFFILIATE_TAG = 'villa9e-20';

export interface AffiliateProduct {
  title:        string;
  description:  string;
  price:        string;
  category:     string;
  asin:         string;     // Amazon Standard Identification Number
  imageUrl:     string;
  affiliateUrl: string;
  relevanceTags: string[];  // goal keywords that trigger this product
}

function amazon(asin: string, title: string, description: string, price: string, category: string, tags: string[]): AffiliateProduct {
  return {
    title, description, price, category, asin,
    imageUrl:     `https://images-na.ssl-images-amazon.com/images/P/${asin}.jpg`,
    affiliateUrl: `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`,
    relevanceTags: tags,
  };
}

// ── Product catalog organized by life domain ──────────────────────────────────
export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  // FITNESS & HEALTH
  amazon('B08H8MC5S2', 'Apple Watch SE (GPS, 44mm)', 'Track your workouts, heart rate, sleep, and activity rings.', '$249', 'Fitness', ['fitness', 'health', 'workout', 'running', 'exercise', 'cardio', 'weight loss', 'marathon']),
  amazon('B07V8KCXTJ', 'Fitbit Charge 5 Advanced Fitness Tracker', 'Built-in GPS, stress management, health metrics.', '$149', 'Fitness', ['fitness', 'health', 'steps', 'sleep', 'workout', 'tracker']),
  amazon('B07DMSD56K', 'Resistance Bands Set (11 Piece)', 'Full body resistance training anywhere — no gym needed.', '$23', 'Fitness', ['fitness', 'strength', 'workout', 'home gym', 'muscle', 'resistance']),
  amazon('B07K3W93NJ', 'Bowflex SelectTech 552 Adjustable Dumbbells', 'Replace 15 sets of weights — adjusts from 5 to 52.5 lbs.', '$349', 'Fitness', ['fitness', 'strength', 'weight training', 'muscle', 'home gym', 'dumbbells']),
  amazon('B087T8HCCR', 'Yoga Mat Premium — Thick Non-Slip', 'Eco-friendly, extra thick for joints support.', '$32', 'Fitness', ['yoga', 'meditation', 'flexibility', 'wellness', 'mindfulness', 'pilates']),
  amazon('B08CVSK3LS', 'Whoop 4.0 Wearable Health Coach', 'Sleep coach, strain coach, and recovery tracker worn 24/7.', '$199', 'Fitness', ['performance', 'recovery', 'sleep', 'fitness', 'athlete', 'health optimization']),
  amazon('B08C4V3Y7C', 'Athletic Greens AG1 Daily Greens', 'All-in-one daily nutrition: vitamins, minerals, probiotics.', '$99', 'Health', ['nutrition', 'health', 'wellness', 'supplements', 'energy', 'diet']),

  // BUSINESS & ENTREPRENEURSHIP
  amazon('B07Z5G3VX2', 'Ring Light 18" with Phone Holder & Tripod', 'Professional lighting for videos, livestreams, content.', '$45', 'Business', ['content creation', 'youtube', 'social media', 'brand', 'business', 'marketing', 'streaming']),
  amazon('B07X3Q6LSL', 'Logitech C920 HD Pro Webcam', '1080p HD video with built-in stereo audio.', '$69', 'Business', ['content creation', 'meetings', 'youtube', 'streaming', 'business', 'remote work']),
  amazon('B08GYKNCCP', 'Blue Yeti USB Microphone', 'Podcast-quality condenser mic, plug-and-play USB.', '$129', 'Business', ['podcast', 'content creation', 'youtube', 'streaming', 'recording', 'business', 'brand']),
  amazon('B07Y82KM3J', '$100M Offers by Alex Hormozi (Kindle)', 'How to make offers so good people feel stupid saying no.', '$9.99', 'Business', ['business', 'sales', 'marketing', 'entrepreneurship', 'offers', 'revenue']),
  amazon('B09GN69H6W', 'Standing Desk Converter by Flexispot', 'Sit-stand workstation for better productivity.', '$129', 'Business', ['productivity', 'office', 'remote work', 'entrepreneurship', 'focus', 'health']),
  amazon('B07Z3Q23YF', 'Rhodia Goalbook Dotted Journal — Black', 'Premium dotted bullet journal for goal planning.', '$18', 'Business', ['planning', 'goals', 'organization', 'productivity', 'journaling', 'strategy']),

  // LEARNING & EDUCATION
  amazon('B08FCWY5X1', 'Kindle Paperwhite (8GB)', 'Waterproof e-reader — carry thousands of books anywhere.', '$99', 'Learning', ['reading', 'learning', 'books', 'education', 'knowledge', 'study']),
  amazon('B07R7XDQHZ', 'Coursera Plus Annual Subscription', 'Unlimited access to 7,000+ courses from top universities.', '$399', 'Learning', ['learning', 'skills', 'education', 'certification', 'career', 'upskill']),
  amazon('B082QYFHQT', 'Atomic Habits by James Clear', 'The science of building good habits and breaking bad ones.', '$14', 'Learning', ['habits', 'productivity', 'self-improvement', 'discipline', 'goals', 'mindset']),
  amazon('B08DKTBH8D', 'Think and Grow Rich by Napoleon Hill', 'The classic book on mindset, success, and manifesting goals.', '$8', 'Learning', ['mindset', 'goals', 'success', 'business', 'wealth', 'achievement', 'law of attraction']),

  // CREATIVE & CONTENT
  amazon('B09JQMJHXY', 'iPad Pro 12.9" M2 (256GB)', 'Pro creative work: art, design, music, video editing.', '$1099', 'Creative', ['design', 'art', 'creative', 'music', 'video', 'content creation', 'digital art']),
  amazon('B09BNR96GN', 'Procreate for iPad (App Store)', 'Industry-leading illustration app for iPad.', '$9.99', 'Creative', ['art', 'design', 'illustration', 'creative', 'digital art', 'drawing']),
  amazon('B07FMPNYC4', 'Rode NT-USB Mini Microphone', 'Studio quality recording for music, podcasts, voiceover.', '$99', 'Creative', ['music', 'recording', 'podcast', 'voiceover', 'content creation', 'streaming']),
  amazon('B08Y5VNZ8X', 'DJI Osmo Mobile 6 Gimbal', '3-axis phone stabilizer for smooth video content.', '$149', 'Creative', ['video', 'content creation', 'social media', 'youtube', 'vlog', 'photography']),
  amazon('B092RQKGVY', 'Sony ZV-E10 Mirrorless Camera', 'Vlog-focused interchangeable lens camera with eye-tracking.', '$698', 'Creative', ['photography', 'video', 'youtube', 'vlog', 'content creation', 'streaming']),

  // WELLNESS & MENTAL HEALTH
  amazon('B07HFXGHLP', 'Calm App Premium Subscription', 'Sleep stories, meditation, breathing, and mindfulness.', '$69.99/yr', 'Wellness', ['meditation', 'sleep', 'anxiety', 'mental health', 'mindfulness', 'stress', 'wellness']),
  amazon('B08HJKBDL4', 'Headspace App Premium', 'Guided meditation and mindfulness for everyday life.', '$69.99/yr', 'Wellness', ['meditation', 'mindfulness', 'stress', 'anxiety', 'sleep', 'mental health']),
  amazon('B01CKMP1GI', 'Theragun Prime Percussive Therapy Device', 'Professional-grade deep tissue massage and recovery.', '$299', 'Wellness', ['recovery', 'massage', 'muscle', 'fitness', 'health', 'pain relief', 'athlete']),
  amazon('B07Q4LCY7L', 'Infrared Sauna Blanket', 'Sweat out toxins, reduce inflammation, improve circulation.', '$179', 'Wellness', ['detox', 'recovery', 'inflammation', 'wellness', 'health', 'sauna', 'relaxation']),
  amazon('B07XB4YN36', 'Eight Sleep Pod Cover', 'Smart mattress cover that heats/cools for optimal sleep.', '$1,595', 'Wellness', ['sleep', 'recovery', 'performance', 'health optimization', 'biohacking']),

  // FINANCIAL & WEALTH
  amazon('B082R43YZH', 'I Will Teach You To Be Rich by Ramit Sethi', 'Automate your finances, crush debt, invest for the future.', '$13', 'Finance', ['money', 'finance', 'investment', 'saving', 'debt', 'budget', 'wealth', 'financial freedom']),
  amazon('B08YJLK7Y3', 'Rich Dad Poor Dad by Robert Kiyosaki', 'The #1 personal finance book of all time.', '$7.99', 'Finance', ['money', 'wealth', 'real estate', 'investing', 'financial freedom', 'business', 'entrepreneurship']),
  amazon('B0B6WZQM3P', 'QuickBooks Self-Employed Annual', 'Track income, expenses, and taxes for freelancers and founders.', '$180/yr', 'Finance', ['business', 'finance', 'taxes', 'accounting', 'freelance', 'entrepreneurship', 'money']),

  // PRODUCTIVITY & ORGANIZATION
  amazon('B07TVMCWKS', 'Moleskine Classic Hard Cover Notebook', 'Premium notebook used by creatives and thinkers worldwide.', '$16', 'Productivity', ['planning', 'writing', 'journaling', 'organization', 'goals', 'creativity']),
  amazon('B07FMPNYC4', 'Logitech MX Master 3 Mouse', 'Precision scrolling and control for demanding workflows.', '$79', 'Productivity', ['productivity', 'office', 'remote work', 'design', 'developer', 'content creation']),
  amazon('B09Y6RV3M4', 'Herman Miller Aeron Chair', 'Ergonomic seating for long work sessions.', '$1,435', 'Productivity', ['office', 'remote work', 'productivity', 'ergonomics', 'posture', 'developer', 'entrepreneur']),
  amazon('B07S6S7N5F', 'LG 27" 4K UHD Monitor', 'Crystal clear 4K display for creative and business work.', '$349', 'Productivity', ['monitor', 'office', 'productivity', 'design', 'content creation', 'remote work', 'developer']),
];

// ── Find relevant products for a goal ────────────────────────────────────────
export function findProductsForGoal(
  goalTitle: string,
  goalCategory: string,
  limit = 4
): AffiliateProduct[] {
  const keywords = `${goalTitle} ${goalCategory}`.toLowerCase().split(/\s+/);

  const scored = AFFILIATE_PRODUCTS.map(p => {
    const score = p.relevanceTags.reduce((acc, tag) => {
      return acc + (keywords.some(k => tag.includes(k) || k.includes(tag)) ? 1 : 0);
    }, 0);
    return { product: p, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.product);
}

// ── Find products for a specific step/action ─────────────────────────────────
export function findProductsForStep(
  stepTitle: string,
  goalCategory: string,
  limit = 2
): AffiliateProduct[] {
  return findProductsForGoal(stepTitle, goalCategory, limit);
}
