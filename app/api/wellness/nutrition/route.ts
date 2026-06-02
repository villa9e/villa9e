import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

interface ScheduleEvent {
  title: string;
  time: string;
  energyType?: string;
}

interface MealItem {
  name: string;
  note?: string;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface Meal {
  name: string;
  items: MealItem[];
  calories: number;
}

interface NutritionPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  reasoning: string;
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { readiness = 0, mood = null, schedule = [] } = body as {
    readiness?: number;
    mood?: string | null;
    schedule?: ScheduleEvent[];
  };

  const scheduleText = schedule.length > 0
    ? schedule.map((e: ScheduleEvent) => `- ${e.time}: ${e.title}${e.energyType ? ` (energy type: ${e.energyType})` : ''}`).join('\n')
    : 'No scheduled events provided.';

  const systemPrompt = `You are Spirit, a warm compassionate AI wellness and nutrition advisor. You create personalized meal plans based on the user's wellness data, upcoming schedule, anti-inflammatory principles, and nutrient timing.

Always return valid JSON in this exact format:
{
  "breakfast": {
    "name": "Meal name",
    "items": [
      { "name": "Food item", "note": "Optional note", "protein": 15, "carbs": 20, "fat": 8 }
    ],
    "calories": 520
  },
  "lunch": {
    "name": "Meal name",
    "items": [...],
    "calories": 650
  },
  "dinner": {
    "name": "Meal name",
    "items": [...],
    "calories": 580
  },
  "reasoning": "2-3 sentence explanation of why this plan fits their data and schedule today."
}

Each meal should have 3-5 items. Items can omit macros if they are condiments or drinks. Keep reasoning warm and specific to the user's data.`;

  const userPrompt = `Generate a personalized day's meal plan for this user:
- Readiness score: ${readiness}/10
- Mood: ${mood ?? 'not logged'}
- Today's schedule:
${scheduleText}

Apply anti-inflammatory principles, optimize nutrient timing around their events, and adjust portion/energy based on readiness. Return only the JSON object.`;

  try {
    const msg = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';

    // Extract JSON from response (Claude may wrap in code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const plan: NutritionPlan = JSON.parse(jsonMatch[0]);

    return NextResponse.json(plan);
  } catch (err) {
    console.error('wellness/nutrition error:', err);
    // Return a safe fallback plan
    const fallback: NutritionPlan = {
      breakfast: {
        name: 'Balanced Morning Fuel',
        items: [
          { name: 'Scrambled eggs (3)', protein: 19, carbs: 1, fat: 14 },
          { name: 'Steel-cut oats ½ cup', protein: 5, carbs: 27, fat: 3, note: 'Sustained energy' },
          { name: 'Blueberries 1 cup', protein: 1, carbs: 21, fat: 0, note: 'Anti-inflammatory' },
          { name: 'Water with electrolytes', note: 'Hydration' },
        ],
        calories: 520,
      },
      lunch: {
        name: 'Anti-Inflammatory Power Lunch',
        items: [
          { name: 'Grilled salmon 5oz', protein: 34, carbs: 0, fat: 18, note: 'Omega-3 · HRV support' },
          { name: 'Quinoa ¾ cup', protein: 6, carbs: 32, fat: 3 },
          { name: 'Roasted vegetables', protein: 4, carbs: 18, fat: 6 },
          { name: 'Olive oil dressing', note: 'Anti-inflammatory' },
        ],
        calories: 680,
      },
      dinner: {
        name: 'Recovery Evening Meal',
        items: [
          { name: 'Chicken breast 6oz', protein: 44, carbs: 0, fat: 9 },
          { name: 'Sweet potato medium', protein: 4, carbs: 37, fat: 0 },
          { name: 'Leafy greens salad', protein: 3, carbs: 8, fat: 2 },
          { name: 'Dark chocolate 1oz', note: 'Magnesium-rich · Sleep support' },
        ],
        calories: 590,
      },
      reasoning: "Spirit is offline right now, so here's a balanced default plan. Log your mood and energy daily to unlock personalized recommendations tailored to your body's patterns.",
    };
    return NextResponse.json(fallback);
  }
}
