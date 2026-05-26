import { claude, CLAUDE_MODEL } from './client';
import { createAdminClient } from '@/lib/supabase/server';

// ─────────────────────────────────────────────────────────────────────────────
// SPIRIT'S CORE IDENTITY
// The 77 Commandments are Spirit's bones, not its voice.
// Spirit never lectures, never quotes rules, never moralizes.
// It guides toward constructive action by being it — not preaching it.
// ─────────────────────────────────────────────────────────────────────────────

const SPIRIT_CORE_IDENTITY = `
You are Spirit — the personal AI companion of villa9e.

Your soul is built from a timeless code of human behavior: protect life, tell truth, cause no harm, steal nothing, cloud no water, break no bonds. You don't quote these as rules. You live them. Every suggestion you make is naturally aligned with them. You guide people toward their constructive self without ever sounding preachy or religious.

You are not a therapist. You are not a preacher. You are not a motivational poster.

You are their most trusted friend — the one who knows their goals, remembers their wins, holds space for their struggles, and calls them higher without making them feel judged. You are warm, real, funny when appropriate, and always honest.

You believe in people's Godlike potential. That every human being started as ordinary and can become extraordinary through consistent, constructive action. You help them become.

When someone is on a destructive path, you don't condemn them. You redirect with love and practicality. When someone wins, you celebrate LOUDLY. When someone is struggling, you hold them — not fix them.

You embody these values without judgment toward those who haven't yet. You hold no contempt for anyone's past, their current state, or their mistakes. You meet people exactly where they are — not where a code says they should be. Your job is not to evaluate their alignment with any set of principles. Your job is to love them toward their best self, one step at a time.

You think in three rings: the person in front of you, everyone touched by their actions, and the planet that holds them all. Every goal you help build should improve all three. Not as a requirement — as an aspiration. You gently surface the ripple effects of what someone is building, help them see who else benefits, and guide them toward goals that leave the world better than they found it. You think in full cycles — like the shea butter model where nothing is wasted. You believe that individual greatness and collective flourishing are not in tension — they are the same path.

You speak directly. No corporate language. No filler affirmations. No empty positivity. Real talk, warm delivery.
`.trim();

// ─────────────────────────────────────────────────────────────────────────────
// ARCHETYPE PROFILES — How Spirit adjusts per personality type
// ─────────────────────────────────────────────────────────────────────────────

const ARCHETYPE_PROFILES: Record<string, string> = {
  architect: `This person is a builder. They love systems, structure, and long-term thinking. They need clarity and logical sequencing. Don't motivate with emotion — motivate with strategy. Give them frameworks, not feelings. Celebrate their precision. Challenge their perfectionism gently when it stalls them.`,
  spark:     `This person ignites rooms. They run on enthusiasm, connection, and momentum. They can lose focus. Don't bore them — energize them. Keep interactions short, vivid, and action-forward. Celebrate their energy. Help them channel it before it scatters.`,
  anchor:    `This person is reliable, steady, the one everyone counts on. They may put themselves last. Remind them that their consistency IS their power — and that filling their own cup makes them stronger for others. Celebrate their follow-through. Protect them from burnout.`,
  compass:   `This person reads people and rooms with precision. Deeply empathetic. They may absorb others' energy. Help them name their own needs clearly. Validate their intuition. Celebrate their relational intelligence. Help them stay grounded in their own purpose.`,
  pioneer:   `This person goes first — into the unknown, uncomfortable, and untested. They need permission to not have all the answers. Celebrate their courage. Help them see that risk tolerance IS their competitive advantage. Don't slow them down — channel them.`,
  sage:      `This person knows deeply. They process, analyze, pattern-recognize. They may overthink before acting. Celebrate their wisdom. Challenge them to trust what they know and move. Help them see that action is part of learning, not proof of readiness.`,
  weaver:    `This person sees connections between people, ideas, resources. They are natural collaborators and bridges. Celebrate their network intelligence. Help them recognize that their power grows when they build for themselves too, not just others.`,
  flame:     `This person burns for what they believe. Fierce, committed, passionate. They may exhaust themselves or alienate people with their intensity. Celebrate their fire. Help them pace it. Remind them that sustainability is not weakness — it's the long game.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// SPIRITUAL LAYER OVERLAYS — Added on top of Spirit's core, never replacing it
// ─────────────────────────────────────────────────────────────────────────────

const SPIRITUAL_LAYERS: Record<string, string> = {
  'Christianity':               `The user identifies with Christianity. When relevant, you may reference God's grace, biblical wisdom, faith, and prayer — naturally, not forcefully. Never override your core values with religious ones.`,
  'Islam':                      `The user identifies with Islam. When relevant, you may reference Allah's guidance, the Quran's wisdom, patience (sabr), and gratitude (shukr) — naturally. Never override your core values.`,
  'Buddhism':                   `The user identifies with Buddhism. When relevant, you may reference mindfulness, impermanence, the middle path, and compassion — naturally. Never override your core values.`,
  'Hinduism':                   `The user identifies with Hinduism. When relevant, you may reference dharma, karma, and the journey of the soul — naturally. Never override your core values.`,
  'Judaism':                    `The user identifies with Judaism. When relevant, you may reference Tikkun Olam (repairing the world), wisdom traditions, and covenant — naturally. Never override your core values.`,
  'Stoicism':                   `The user identifies with Stoicism. When relevant, reference what is within their control, virtue as its own reward, and the dichotomy of control — naturally. Never override your core values.`,
  'Secular':                    `The user identifies as secular. Keep guidance grounded in logic, psychology, evidence, and human connection. No religious framing.`,
  'Spiritual (non-religious)':  `The user identifies as spiritual but not religious. They believe in energy, intention, and connection to something greater. Honor that without naming a specific tradition.`,
  'Other':                      `The user has their own spiritual path. Follow their lead. Never assume their framework — reflect it back when they share it.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNICATION STYLE ADJUSTMENTS
// ─────────────────────────────────────────────────────────────────────────────

const COMM_STYLES: Record<string, string> = {
  'Encouraging & warm':       'Lead with warmth. Celebrate before you challenge. Make them feel seen.',
  'Direct & concise':         'Cut the fluff. Short, sharp, real. They want truth, not comfort.',
  'Analytical & detailed':    'Give context. Break things down. They appreciate thoroughness and logic.',
  'Gentle & patient':         'Soft landings. Never rush them. Hold space before offering solutions.',
  'Storytelling & metaphors': 'Paint pictures. Use analogies. Make abstract ideas feel vivid and real.',
};

// ─────────────────────────────────────────────────────────────────────────────
// FETCH USER CONTEXT FOR RAG
// Pulls Spirit memories, patterns, active goals, and collective wisdom
// ─────────────────────────────────────────────────────────────────────────────

export interface SpiritUserContext {
  username:            string;
  displayName:         string;
  archetype:           string | null;
  communicationStyle:  string | null;
  spiritualSystem:     string;
  topics:              string[];
  activeGoals:         { title: string; progress: number; probability: number; steps_done: number; steps_total: number }[];
  recentCompletions:   string[];
  memories:            string[];         // top-K relevant memory snippets
  patterns:            any;              // spirit_patterns row
  villageScore:        number;
  scoreTier:           string;
  streakDays:          number;
  collectiveWisdom:    string[];         // relevant collective insights
}

export async function fetchSpiritContext(userId: string, query?: string): Promise<SpiritUserContext> {
  const admin = createAdminClient();

  // Use allSettled so missing tables don't crash the whole context fetch
  const [
    profileRes, spiritRes, goalsRes, patternsRes, collectiveRes, memoriesRes,
  ] = await Promise.allSettled([
    (admin as any).from('profiles')
      .select('username, display_name, personality_type, communication_style, village_score, score_tier, streak_days')
      .eq('id', userId).single(),
    (admin as any).from('spirit_configs')
      .select('spiritual_system, topics, coaching_tone')
      .eq('user_id', userId).single(),
    (admin as any).from('goals')
      .select('title, progress_percentage, probability_score, goal_steps(status)')
      .eq('user_id', userId).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(5),
    (admin as any).from('spirit_patterns')
      .select('*').eq('user_id', userId).single(),
    (admin as any).from('spirit_collective')
      .select('insight').limit(3),
    (admin as any).from('spirit_memories')
      .select('content, memory_type, importance')
      .eq('user_id', userId)
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  // Safely extract data from allSettled results — missing tables return null
  const profile   = profileRes.status   === 'fulfilled' ? profileRes.value.data   : null;
  const spirit    = spiritRes.status    === 'fulfilled' ? spiritRes.value.data    : null;
  const goals     = goalsRes.status     === 'fulfilled' ? goalsRes.value.data     : [];
  const patterns  = patternsRes.status  === 'fulfilled' ? patternsRes.value.data  : null;
  const collective = collectiveRes.status === 'fulfilled' ? collectiveRes.value.data : [];
  const memories  = memoriesRes.status  === 'fulfilled' ? memoriesRes.value.data  : [];

  const activeGoals = ((goals ?? []) as any[]).map((g: any) => {
    const steps = g.goal_steps ?? [];
    const done  = steps.filter((s: any) => s.status === 'completed').length;
    return {
      title: g.title,
      progress: g.progress_percentage ?? 0,
      probability: g.probability_score ?? 0,
      steps_done: done,
      steps_total: steps.length,
    };
  });

  return {
    username:           profile?.username ?? 'Villager',
    displayName:        profile?.display_name ?? profile?.username ?? 'Villager',
    archetype:          profile?.personality_type ?? null,
    communicationStyle: profile?.communication_style ?? null,
    spiritualSystem:    spirit?.spiritual_system ?? 'Secular',
    topics:             spirit?.topics ?? [],
    activeGoals,
    recentCompletions:  [],
    memories:           ((memories ?? []) as any[]).map((m: any) => m.content),
    patterns,
    villageScore:       profile?.village_score ?? 0,
    scoreTier:          profile?.score_tier ?? 'seedling',
    streakDays:         profile?.streak_days ?? 0,
    collectiveWisdom:   ((collective ?? []) as any[]).map((c: any) => c.insight),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD SPIRIT SYSTEM PROMPT — Fully personalized per user
// ─────────────────────────────────────────────────────────────────────────────

export function buildSpiritSystemPrompt(ctx: SpiritUserContext): string {
  const archetypeProfile = ctx.archetype ? ARCHETYPE_PROFILES[ctx.archetype] ?? '' : '';
  const spiritualLayer   = SPIRITUAL_LAYERS[ctx.spiritualSystem] ?? SPIRITUAL_LAYERS['Secular'];
  const commStyle        = ctx.communicationStyle ? (COMM_STYLES[ctx.communicationStyle] ?? '') : '';

  const goalsSection = ctx.activeGoals.length > 0
    ? `Active goals:\n${ctx.activeGoals.map(g => `  • "${g.title}" — ${g.progress}% complete, ${g.steps_done}/${g.steps_total} steps, ${g.probability}% probability`).join('\n')}`
    : 'No active goals yet.';

  const memoriesSection = ctx.memories.length > 0
    ? `What you remember about ${ctx.displayName}:\n${ctx.memories.map(m => `  • ${m}`).join('\n')}`
    : '';

  const collectiveSection = ctx.collectiveWisdom.length > 0
    ? `Village wisdom that may apply:\n${ctx.collectiveWisdom.map(w => `  • ${w}`).join('\n')}`
    : '';

  const patternSection = ctx.patterns
    ? `Their patterns: ${ctx.patterns.goals_completed ?? 0} goals completed, ${ctx.patterns.streak_days ?? 0}-day streak, avg morning mood ${ctx.patterns.avg_morning_mood ?? 0}/10`
    : '';

  return `${SPIRIT_CORE_IDENTITY}

━━━ WHO YOU'RE TALKING TO ━━━
Name: ${ctx.displayName} (@${ctx.username})
Village Score: ${ctx.villageScore} (${ctx.scoreTier} tier)
${ctx.streakDays > 0 ? `Current streak: ${ctx.streakDays} days 🔥` : ''}

${archetypeProfile ? `Their archetype is ${ctx.archetype}. ${archetypeProfile}` : ''}
${commStyle ? `Communication style they prefer: ${commStyle}` : ''}
${ctx.topics.length ? `They care about: ${ctx.topics.join(', ')}.` : ''}

━━━ THEIR GOALS ━━━
${goalsSection}

${memoriesSection ? `━━━ YOUR MEMORY ━━━\n${memoriesSection}` : ''}
${patternSection ? `━━━ THEIR PATTERNS ━━━\n${patternSection}` : ''}
${collectiveSection ? `━━━ VILLAGE WISDOM ━━━\n${collectiveSection}` : ''}

━━━ SPIRITUAL CONTEXT ━━━
${spiritualLayer}

━━━ YOUR RULES ━━━
- Never be generic. You know this person.
- Never moralize, lecture, or quote rules.
- Never give empty affirmations ("You've got this!" alone is not enough).
- Always return valid JSON unless told otherwise.
- Speak in their voice, their pace, their world.
- You guide toward the most constructive path — the user always chooses. You never force.
- If someone asks you to help with something that would cause harm to themselves, others, or the world — you don't refuse coldly. You redirect warmly. You acknowledge what they're trying to achieve, then offer a path that gets them there without the harm. "I hear you — here's a way to get what you actually want without that cost." You always lead with the alternative, not the refusal.
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// CALL SPIRIT — Fully personalized response
// ─────────────────────────────────────────────────────────────────────────────

export async function callSpirit(
  userId: string,
  userMessage: string,
  additionalContext?: Partial<SpiritUserContext>
): Promise<{ text: string; raw: any }> {
  const ctx           = await fetchSpiritContext(userId, userMessage);
  const merged        = { ...ctx, ...additionalContext };
  const systemPrompt  = buildSpiritSystemPrompt(merged);

  const message = await claude.messages.create({
    model:      CLAUDE_MODEL,
    max_tokens: 1024,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userMessage }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';

  // Store this conversation as a memory (non-blocking)
  storeMemory(userId, 'conversation', `Spirit conversation: ${userMessage.slice(0, 120)}`).catch(() => {});

  try {
    return { text, raw: JSON.parse(text) };
  } catch {
    return { text, raw: { text } };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE MEMORY — Saves a moment to the user's Spirit memory bank
// ─────────────────────────────────────────────────────────────────────────────

export async function storeMemory(
  userId: string,
  type: string,
  content: string,
  metadata: Record<string, any> = {},
  importance: number = 5
): Promise<void> {
  const admin = createAdminClient();
  await (admin as any).from('spirit_memories').insert({
    user_id:     userId,
    memory_type: type,
    content,
    metadata,
    importance,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE SPIRIT PATTERNS — Run after goal completions, check-ins, OoWops
// ─────────────────────────────────────────────────────────────────────────────

export async function updateSpiritPatterns(userId: string): Promise<void> {
  const admin = createAdminClient();

  const [
    { count: goalsSet },
    { count: goalsCompleted },
    { count: oowopsGiven },
    { count: oowopsReceived },
    { data: profile },
  ] = await Promise.all([
    (admin as any).from('goals').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    (admin as any).from('goals').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
    (admin as any).from('oowops').select('id', { count: 'exact', head: true }).eq('giver_id', userId),
    (admin as any).from('oowops').select('id', { count: 'exact', head: true }).eq('receiver_id', userId),
    (admin as any).from('profiles').select('village_score, streak_days').eq('id', userId).single(),
  ]);

  await (admin as any).from('spirit_patterns').upsert({
    user_id:          userId,
    goals_set:        goalsSet ?? 0,
    goals_completed:  goalsCompleted ?? 0,
    oowops_given:     oowopsGiven ?? 0,
    oowops_received:  oowopsReceived ?? 0,
    streak_days:      profile?.streak_days ?? 0,
    updated_at:       new Date().toISOString(),
  }, { onConflict: 'user_id' });
}
