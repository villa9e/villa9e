// GPS V2 — Multi-agent goal planning orchestrator
// Wave 1 (parallel): Skills, Funding, Team, Time, AI Resources agents
// Wave 2 (parallel): Gap Analysis + Probability agents
// Wave 3 (sequential, gated at 95%): Sprint Architect
// Wave 4 (on-demand): Recalibration Engine

import { claude, CLAUDE_MODEL } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoalInput {
  title: string;
  description?: string;
  category: string;
  targetDate?: string;
  estimatedCost?: number;
}

export interface UserGPSProfile {
  id: string;
  displayName: string;
  archetype?: string;
  skills: Array<{ skill_name: string; rating: number }>;
  weeklyAvailableHours: number;
  financialProfile: {
    plaidConnected: boolean;
    estimatedMonthlyBudget: number;
    crowdfundCapacity: number;
  };
  completionRate: number; // 0–1, historical
}

export interface SkillsCircumstance {
  required: string[];
  userHas: string[];
  gap: string[];
  severity: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  workshopCourses: string[];
  estimatedWeeksToFill: number;
}

export interface FundingStrategy {
  type: 'self_pay' | 'crowdfunding' | 'credit' | 'microtrust' | 'grant' | 'trading';
  amount: number;
  feasibility: 'high' | 'moderate' | 'low';
  villageRoute: string;
  timeToSecure: string;
}

export interface FundingCircumstance {
  totalEstimated: number;
  userAvailable: number;
  gap: number;
  severity: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  strategies: FundingStrategy[];
  canFundWithCurrentResources: boolean;
}

export interface TeamRole {
  role: string;
  criticality: 'essential' | 'helpful' | 'optional';
  skillsRequired: string[];
  canBeFilled: 'trading_post' | 'tribes' | 'hire' | 'ai';
}

export interface TeamCircumstance {
  rolesNeeded: TeamRole[];
  canSoloOrPartiallyComplete: boolean;
  severity: 'none' | 'low' | 'moderate' | 'high' | 'critical';
}

export interface TimeCircumstance {
  hoursPerWeekNeeded: number;
  hoursPerWeekAvailable: number;
  deficit: number;
  severity: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  canAccelerateWith: string[];
  realisticTimelineWeeks: number;
}

export interface AITool {
  tool: string;
  use: string;
  accelerationFactor: number;
  availableInVilla9e: boolean;
}

export interface AIResourcesCircumstance {
  applicableTools: AITool[];
  totalAccelerationFactor: number;
  aiCanReplace: string[];
}

export interface GoalCircumstances {
  skills: SkillsCircumstance;
  funding: FundingCircumstance;
  team: TeamCircumstance;
  time: TimeCircumstance;
  aiResources: AIResourcesCircumstance;
}

export interface Gap {
  dimension: 'skills' | 'funding' | 'team' | 'time';
  gap: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  fillStrategy: string;
  villageRoute: string;
  estimatedTimeToFillWeeks: number;
  probabilityImpact: number;
}

export interface GapAnalysis {
  gaps: Gap[];
  probWithoutGapsFilled: number;
  probWithAllGapsFilled: number;
  probWithRecommendedGapsFilled: number;
  recommendedGapOrder: string[];
  villageRoutesNeeded: {
    workshop: boolean;
    tradingPost: boolean;
    bank: boolean;
    tribes: boolean;
  };
  analysisText: string;
  canReach95: boolean;
}

export interface ProbabilityFactors {
  skillsScore: number;
  fundingScore: number;
  teamScore: number;
  timeScore: number;
  aiBoost: number;
  momentumScore: number;
  historicalCompletionRate: number;
}

export interface GPSProbability {
  score: number;
  meetsThreshold: boolean;
  delta: number;
  factors: ProbabilityFactors;
  reasoning: string;
  keyRisk: string;
  pathTo95: string;
}

export interface GPSAction {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  resourceCategory: 'research' | 'creation' | 'outreach' | 'learning' | 'production' | 'funding' | 'networking';
  canRunInParallel: boolean;
  dependsOn: string[];
  villageResourceNeeded?: string;
  aiCanAssist: boolean;
  aiAssistanceNotes?: string;
}

export interface GPSSprint {
  title: string;
  milestone: string;
  direction: string;
  durationWeeks: number;
  actions: GPSAction[];
  probabilityContribution: number;
  dependsOnSprints: string[];
  canRunParallelWith: string[];
}

export interface GPSPlan {
  circumstances: GoalCircumstances;
  gapAnalysis: GapAnalysis;
  probability: GPSProbability;
  sprints: GPSSprint[];
  totalWeeks: number;
  criticalPath: string[];
  scenarioImpacts: {
    ifFundingFails: string;
    ifTeamMemberJoins: string;
    ifSkillGapFilled: string;
  };
}

export interface RecalibrationEvent {
  type: 'action_missed' | 'sprint_missed' | 'life_event' | 'user_request';
  description: string;
  dimension?: 'skills' | 'funding' | 'team' | 'time' | 'scope' | 'health' | 'general';
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: 'minor' | 'moderate' | 'major';
}

export interface RecalibrationResult {
  spiritMessage: string;
  newProbability: number;
  probabilityDelta: number;
  newTimelineWeeks: number;
  timelineDeltaWeeks: number;
  timelineDeltaExplainer: string;
  probabilityExplainer: string;
  recalibratedSprints: GPSSprint[];
  momentumAction: string;
  recalibrationInsight: string;
  isOnTrack: boolean;
}

// ─── Default fallbacks ────────────────────────────────────────────────────────

const defaultSkills = (): SkillsCircumstance => ({
  required: [], userHas: [], gap: [], severity: 'none', workshopCourses: [], estimatedWeeksToFill: 0,
});

const defaultFunding = (): FundingCircumstance => ({
  totalEstimated: 0, userAvailable: 0, gap: 0, severity: 'none', strategies: [], canFundWithCurrentResources: true,
});

const defaultTeam = (): TeamCircumstance => ({
  rolesNeeded: [], canSoloOrPartiallyComplete: true, severity: 'none',
});

const defaultTime = (available: number): TimeCircumstance => ({
  hoursPerWeekNeeded: 10, hoursPerWeekAvailable: available, deficit: 0, severity: 'none', canAccelerateWith: [], realisticTimelineWeeks: 12,
});

const defaultAI = (): AIResourcesCircumstance => ({
  applicableTools: [], totalAccelerationFactor: 0, aiCanReplace: [],
});

const defaultGapAnalysis = (): GapAnalysis => ({
  gaps: [], probWithoutGapsFilled: 50, probWithAllGapsFilled: 50, probWithRecommendedGapsFilled: 50,
  recommendedGapOrder: [], villageRoutesNeeded: { workshop: false, tradingPost: false, bank: false, tribes: false },
  analysisText: 'Assessment complete.', canReach95: false,
});

const defaultProbability = (): GPSProbability => ({
  score: 50, meetsThreshold: false, delta: 0,
  factors: { skillsScore: 50, fundingScore: 50, teamScore: 50, timeScore: 50, aiBoost: 0, momentumScore: 50, historicalCompletionRate: 50 },
  reasoning: 'Circumstances assessed.', keyRisk: 'Unknown risk.', pathTo95: 'Fill identified gaps.',
});

function parseJSON<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text.match(/\{[\s\S]+\}/)?.[0] ?? '{}') as T;
  } catch {
    return fallback;
  }
}

// ─── Wave 1: Parallel circumstance agents ─────────────────────────────────────

async function runSkillsAgent(goal: GoalInput, skills: UserGPSProfile['skills']): Promise<SkillsCircumstance> {
  const msg = await claude.messages.create({
    model: CLAUDE_MODEL, max_tokens: 600,
    messages: [{
      role: 'user',
      content: `You are a Skills Assessment Agent in a multi-agent GPS goal planning system.

Goal: "${goal.title}" — ${goal.category}
${goal.description ? `Description: ${goal.description}` : ''}

User skills (rating 1–10):
${skills.length > 0 ? skills.map(s => `- ${s.skill_name}: ${s.rating}/10`).join('\n') : 'No skills listed yet'}

Assess what skills this goal TRULY requires (not nice-to-haves). Compare against user's current skills.
A skill "counts" if the user has it at rating 6+. Be realistic and specific.

Return ONLY valid JSON:
{
  "required": ["skill1", "skill2"],
  "userHas": ["skills from required that user has rated 6+"],
  "gap": ["skills genuinely needed that user lacks or rates below 6"],
  "severity": "none|low|moderate|high|critical",
  "workshopCourses": ["search term for Workshop skill-stream to close gap"],
  "estimatedWeeksToFill": 3
}`,
    }],
  });
  const txt = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  return parseJSON<SkillsCircumstance>(txt, defaultSkills());
}

async function runFundingAgent(goal: GoalInput, fp: UserGPSProfile['financialProfile']): Promise<FundingCircumstance> {
  const msg = await claude.messages.create({
    model: CLAUDE_MODEL, max_tokens: 700,
    messages: [{
      role: 'user',
      content: `You are a Funding Assessment Agent in a multi-agent GPS goal planning system.

Goal: "${goal.title}" — ${goal.category}
User-estimated cost: ${goal.estimatedCost ? '$' + goal.estimatedCost : 'not specified'}
User financial profile:
- Plaid bank connected: ${fp.plaidConnected}
- Est. monthly discretionary budget: $${fp.estimatedMonthlyBudget}
- Crowdfund capacity (audience size): ${fp.crowdfundCapacity}

villa9e funding routes available: crowdfunding (Bank), microtrust (group pay), credit, self-pay.
Consider real costs: tools, courses, materials, services, hiring, AI subscriptions.

Return ONLY valid JSON:
{
  "totalEstimated": 5000,
  "userAvailable": 800,
  "gap": 4200,
  "severity": "none|low|moderate|high|critical",
  "strategies": [
    {
      "type": "self_pay|crowdfunding|credit|microtrust|grant|trading",
      "amount": 2000,
      "feasibility": "high|moderate|low",
      "villageRoute": "/village/bank/crowdfunding",
      "timeToSecure": "2–4 weeks"
    }
  ],
  "canFundWithCurrentResources": false
}`,
    }],
  });
  const txt = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  return parseJSON<FundingCircumstance>(txt, defaultFunding());
}

async function runTeamAgent(goal: GoalInput): Promise<TeamCircumstance> {
  const msg = await claude.messages.create({
    model: CLAUDE_MODEL, max_tokens: 500,
    messages: [{
      role: 'user',
      content: `You are a Team Assessment Agent in a multi-agent GPS goal planning system.

Goal: "${goal.title}" — ${goal.category}
${goal.description ? `Description: ${goal.description}` : ''}

villa9e has: Trading Post (hire/trade skills), Tribes (collective work), AI (Claude, image gen, voice).
Determine what team roles this goal needs, if any. Many goals are achievable solo + AI.
Only flag roles that are genuinely needed.

Return ONLY valid JSON:
{
  "rolesNeeded": [
    {
      "role": "Videographer",
      "criticality": "essential|helpful|optional",
      "skillsRequired": ["camera operation", "lighting"],
      "canBeFilled": "trading_post|tribes|hire|ai"
    }
  ],
  "canSoloOrPartiallyComplete": true,
  "severity": "none|low|moderate|high|critical"
}`,
    }],
  });
  const txt = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  return parseJSON<TeamCircumstance>(txt, defaultTeam());
}

async function runTimeAgent(goal: GoalInput, weeklyHours: number): Promise<TimeCircumstance> {
  const weeksToDeadline = goal.targetDate
    ? Math.max(1, Math.floor((new Date(goal.targetDate).getTime() - Date.now()) / 604800000))
    : null;

  const msg = await claude.messages.create({
    model: CLAUDE_MODEL, max_tokens: 500,
    messages: [{
      role: 'user',
      content: `You are a Time Assessment Agent in a multi-agent GPS goal planning system.

Goal: "${goal.title}" — ${goal.category}
User's weekly available hours: ${weeklyHours}h
${weeksToDeadline ? `Deadline: ${weeksToDeadline} weeks from now` : 'No hard deadline'}

Estimate realistic weekly time commitment including: learning curve, doing the work, admin, iteration.
If user time is insufficient, suggest accelerators (AI, delegation, batching).

Return ONLY valid JSON:
{
  "hoursPerWeekNeeded": 12,
  "hoursPerWeekAvailable": ${weeklyHours},
  "deficit": 0,
  "severity": "none|low|moderate|high|critical",
  "canAccelerateWith": ["AI drafts = 3h saved/week", "batch research sessions = 2h saved"],
  "realisticTimelineWeeks": 14
}`,
    }],
  });
  const txt = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  return parseJSON<TimeCircumstance>(txt, defaultTime(weeklyHours));
}

async function runAIResourcesAgent(goal: GoalInput): Promise<AIResourcesCircumstance> {
  const msg = await claude.messages.create({
    model: CLAUDE_MODEL, max_tokens: 500,
    messages: [{
      role: 'user',
      content: `You are an AI Resources Agent in a multi-agent GPS goal planning system.

Goal: "${goal.title}" — ${goal.category}

Available in villa9e: Claude (writing, planning, analysis), ElevenLabs (voice), Cloudinary (image/video), Spotify API (music).
External tools: ChatGPT, Perplexity, Cursor, Runway, Midjourney, GitHub Copilot, Notion AI, etc.

For each applicable tool, estimate acceleration factor (0–1: what fraction of related work it handles).
Be specific — "AI can draft scripts" is better than "AI helps with content."

Return ONLY valid JSON:
{
  "applicableTools": [
    {
      "tool": "Claude",
      "use": "Draft scripts, plans, outlines, email templates",
      "accelerationFactor": 0.4,
      "availableInVilla9e": true
    }
  ],
  "totalAccelerationFactor": 0.3,
  "aiCanReplace": ["first draft writing", "market research summaries", "image generation"]
}`,
    }],
  });
  const txt = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  return parseJSON<AIResourcesCircumstance>(txt, defaultAI());
}

// ─── Wave 2: Gap analysis + Probability (parallel) ────────────────────────────

async function analyzeGaps(goal: GoalInput, c: GoalCircumstances): Promise<GapAnalysis> {
  const msg = await claude.messages.create({
    model: CLAUDE_MODEL, max_tokens: 900,
    messages: [{
      role: 'user',
      content: `You are the Gap Analysis Agent in a GPS goal planning system.

Goal: "${goal.title}"

Assessed circumstances:
SKILLS: ${c.skills.gap.length} gaps — [${c.skills.gap.join(', ') || 'none'}] — severity: ${c.skills.severity}
FUNDING: $${c.funding.gap} gap — severity: ${c.funding.severity} — strategies available: ${c.funding.strategies.map(s => s.type).join(', ') || 'none'}
TEAM: essential roles needed: [${c.team.rolesNeeded.filter(r => r.criticality === 'essential').map(r => r.role).join(', ') || 'none'}] — severity: ${c.team.severity}
TIME: ${c.time.deficit}h/week deficit — severity: ${c.time.severity}

For each real gap, determine: how to fill it, which village feature to use, how long it takes, how much it boosts probability.
A gap only counts if it materially affects the goal. Be selective.

village9e routes: /village/workshop/skill-stream (skills), /village/bank (funding), /village/trading-post (team), /village/tribes (collective work)

Return ONLY valid JSON:
{
  "gaps": [
    {
      "dimension": "skills|funding|team|time",
      "gap": "specific missing thing",
      "severity": "low|moderate|high|critical",
      "fillStrategy": "exactly how to fill it",
      "villageRoute": "/village/workshop/skill-stream?q=video+editing",
      "estimatedTimeToFillWeeks": 3,
      "probabilityImpact": 12
    }
  ],
  "probWithoutGapsFilled": 68,
  "probWithAllGapsFilled": 94,
  "probWithRecommendedGapsFilled": 90,
  "recommendedGapOrder": ["fill skill gap first — it blocks everything else", "then secure funding"],
  "villageRoutesNeeded": {
    "workshop": true,
    "tradingPost": false,
    "bank": true,
    "tribes": false
  },
  "analysisText": "Two honest sentences about the gap picture and what closing them unlocks.",
  "canReach95": false
}`,
    }],
  });
  const txt = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  return parseJSON<GapAnalysis>(txt, defaultGapAnalysis());
}

async function calculateProbability(
  goal: GoalInput,
  c: GoalCircumstances,
  gaps: GapAnalysis,
  profile: UserGPSProfile
): Promise<GPSProbability> {
  const msg = await claude.messages.create({
    model: CLAUDE_MODEL, max_tokens: 600,
    messages: [{
      role: 'user',
      content: `You are the Probability Scoring Agent in a GPS goal planning system.

Goal: "${goal.title}" — ${goal.category}
User: ${profile.displayName}, archetype: ${profile.archetype ?? 'unknown'}
Historical goal completion rate: ${Math.round(profile.completionRate * 100)}%

Current circumstances:
- Skills severity: ${c.skills.severity} | gap count: ${c.skills.gap.length}
- Funding severity: ${c.funding.severity} | $${c.funding.gap} gap
- Team severity: ${c.team.severity} | essential roles missing: ${c.team.rolesNeeded.filter(r => r.criticality === 'essential').length}
- Time severity: ${c.time.severity} | ${c.time.deficit}h/week deficit
- AI acceleration available: ${Math.round(c.aiResources.totalAccelerationFactor * 100)}%

Gap analysis: current gaps bring probability to ~${gaps.probWithoutGapsFilled}%. Filling all gaps: ~${gaps.probWithAllGapsFilled}%.

Score the CURRENT probability (gaps as-is, right now). Be honest — not aspirational.
Threshold to activate sprints: 95%.

Return ONLY valid JSON:
{
  "score": 72,
  "meetsThreshold": false,
  "delta": 0,
  "factors": {
    "skillsScore": 60,
    "fundingScore": 70,
    "teamScore": 90,
    "timeScore": 80,
    "aiBoost": 8,
    "momentumScore": 75,
    "historicalCompletionRate": 65
  },
  "reasoning": "One honest sentence about what drives the current score.",
  "keyRisk": "The single biggest threat to this goal.",
  "pathTo95": "Specifically what needs to change to reach 95%."
}`,
    }],
  });
  const txt = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  const result = parseJSON<GPSProbability>(txt, defaultProbability());
  result.meetsThreshold = result.score >= 95;
  return result;
}

// ─── Wave 3: Sprint generation (gated at 95%) ─────────────────────────────────

async function generateSprints(
  goal: GoalInput,
  c: GoalCircumstances,
  probability: GPSProbability,
  profile: UserGPSProfile
): Promise<{ sprints: GPSSprint[]; totalWeeks: number; criticalPath: string[] }> {
  const msg = await claude.messages.create({
    model: CLAUDE_MODEL, max_tokens: 2400,
    messages: [{
      role: 'user',
      content: `You are the Sprint Architect Agent in a GPS goal planning system.
Probability score: ${probability.score}% — threshold met. Sprints are now authorized.

Goal: "${goal.title}" — ${goal.category}
${goal.description ? `Description: ${goal.description}` : ''}
User archetype: ${profile.archetype ?? 'unknown'}
Weekly hours available: ${c.time.hoursPerWeekAvailable}h (AI reduces workload by ${Math.round(c.aiResources.totalAccelerationFactor * 100)}%)
Key risk: ${probability.keyRisk}

Think of this as a real GPS:
- SPRINT = a direction ("Turn right in 1/4 mile") — has a clear milestone destination
- ACTION = a step within that direction — what you do between turns
- Missing an ACTION → GPS adjusts the current sprint (local recalibration)
- Missing a SPRINT MILESTONE → GPS recalculates the full route
- Some sprints can run IN PARALLEL (like securing funding while building a skill)

Design for this user's REAL constraints. Use AI to compress timelines where noted.

Return ONLY valid JSON:
{
  "sprints": [
    {
      "title": "Sprint 1: Foundation",
      "milestone": "Concrete, verifiable outcome — what exists when this sprint is done",
      "direction": "Short GPS-style direction instruction (under 8 words)",
      "durationWeeks": 2,
      "actions": [
        {
          "id": "s1a1",
          "title": "Action title",
          "description": "Exactly what to do — specific, not vague",
          "estimatedHours": 3,
          "resourceCategory": "research|creation|outreach|learning|production|funding|networking",
          "canRunInParallel": false,
          "dependsOn": [],
          "villageResourceNeeded": "/village/workshop or null",
          "aiCanAssist": true,
          "aiAssistanceNotes": "Claude drafts this in 15 minutes"
        }
      ],
      "probabilityContribution": 8,
      "dependsOnSprints": [],
      "canRunParallelWith": []
    }
  ],
  "totalWeeks": 12,
  "criticalPath": ["Sprint 1: Foundation", "Sprint 3: Launch"]
}

Rules: max 5 sprints, 3–6 actions each. Be realistic about hours. Mark parallel opportunities.`,
    }],
  });
  const txt = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  return parseJSON(txt, { sprints: [], totalWeeks: c.time.realisticTimelineWeeks, criticalPath: [] });
}

// ─── Recalibration Engine ─────────────────────────────────────────────────────

export async function runRecalibration(
  goal: { id: string; title: string; probability_score: number; estimated_weeks: number },
  currentSprints: GPSSprint[],
  event: RecalibrationEvent,
  profile: UserGPSProfile
): Promise<RecalibrationResult> {
  // Run probability recalculator and sprint recalibrator in parallel
  const [probMsg, sprintMsg] = await Promise.all([
    claude.messages.create({
      model: CLAUDE_MODEL, max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Recalculate GPS probability for a goal.

Goal: "${goal.title}"
Current probability: ${goal.probability_score}%
Event: ${event.type} — ${event.description}
Impact: ${event.impact}, magnitude: ${event.magnitude}
User completion rate: ${Math.round(profile.completionRate * 100)}%

How does this event change the probability? Be honest and precise.

Return ONLY valid JSON:
{
  "newProbability": 76,
  "probabilityDelta": -4,
  "probabilityExplainer": "One sentence on why it changed.",
  "isOnTrack": true
}`,
      }],
    }),
    claude.messages.create({
      model: CLAUDE_MODEL, max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are the GPS Recalibration Engine. A GPS never scolds you for a missed turn. It recalculates. Silently. Confidently.

Goal: "${goal.title}"
Current timeline: ${goal.estimated_weeks} weeks remaining
Event: ${event.type} — ${event.impact} — ${event.description}

Current sprints:
${currentSprints.slice(0, 5).map((s, i) => `Sprint ${i + 1}: ${s.title} → ${s.milestone} (${s.durationWeeks}w)`).join('\n')}

${event.impact === 'positive' ? 'GOOD NEWS — find how to accelerate or boost confidence.' : ''}
${event.impact === 'negative' ? 'SETBACK — find fastest realistic path from current position. No mention of the missed step.' : ''}

Return ONLY valid JSON:
{
  "spiritMessage": "2–3 sentences. Warm. Forward-looking. No shame. New path shown with confidence.",
  "newTimelineWeeks": 14,
  "timelineDeltaWeeks": 2,
  "timelineDeltaExplainer": "One sentence on why timeline changed.",
  "recalibratedSprints": [
    {
      "title": "Sprint title",
      "milestone": "Milestone",
      "direction": "GPS direction",
      "durationWeeks": 2,
      "actions": [],
      "probabilityContribution": 10,
      "dependsOnSprints": [],
      "canRunParallelWith": []
    }
  ],
  "momentumAction": "Single most important thing to do in the next 24 hours.",
  "recalibrationInsight": "One clear honest insight about this moment — not a lecture."
}`,
      }],
    }),
  ]);

  const probTxt = probMsg.content[0].type === 'text' ? probMsg.content[0].text : '{}';
  const sprintTxt = sprintMsg.content[0].type === 'text' ? sprintMsg.content[0].text : '{}';

  const probResult = parseJSON<Partial<RecalibrationResult>>(probTxt, {});
  const sprintResult = parseJSON<Partial<RecalibrationResult>>(sprintTxt, {});

  return {
    spiritMessage: sprintResult.spiritMessage ?? 'Route updated. Your GPS has a new path.',
    newProbability: probResult.newProbability ?? goal.probability_score,
    probabilityDelta: probResult.probabilityDelta ?? 0,
    newTimelineWeeks: sprintResult.newTimelineWeeks ?? goal.estimated_weeks,
    timelineDeltaWeeks: sprintResult.timelineDeltaWeeks ?? 0,
    timelineDeltaExplainer: sprintResult.timelineDeltaExplainer ?? 'Timeline unchanged.',
    probabilityExplainer: probResult.probabilityExplainer ?? 'Probability unchanged.',
    recalibratedSprints: (sprintResult.recalibratedSprints as GPSSprint[]) ?? currentSprints,
    momentumAction: sprintResult.momentumAction ?? 'Focus on your next action.',
    recalibrationInsight: sprintResult.recalibrationInsight ?? 'Keep moving forward.',
    isOnTrack: probResult.isOnTrack ?? true,
  };
}

// ─── Main GPS pipeline ────────────────────────────────────────────────────────

export async function runGPSPipeline(
  goal: GoalInput,
  profile: UserGPSProfile,
  opts: { generateSprints?: boolean } = {}
): Promise<GPSPlan> {
  // Wave 1: All 5 circumstance agents in parallel
  const [skillsRes, fundingRes, teamRes, timeRes, aiRes] = await Promise.allSettled([
    runSkillsAgent(goal, profile.skills),
    runFundingAgent(goal, profile.financialProfile),
    runTeamAgent(goal),
    runTimeAgent(goal, profile.weeklyAvailableHours),
    runAIResourcesAgent(goal),
  ]);

  const circumstances: GoalCircumstances = {
    skills:      skillsRes.status === 'fulfilled' ? skillsRes.value : defaultSkills(),
    funding:     fundingRes.status === 'fulfilled' ? fundingRes.value : defaultFunding(),
    team:        teamRes.status === 'fulfilled' ? teamRes.value : defaultTeam(),
    time:        timeRes.status === 'fulfilled' ? timeRes.value : defaultTime(profile.weeklyAvailableHours),
    aiResources: aiRes.status === 'fulfilled' ? aiRes.value : defaultAI(),
  };

  // Wave 2: Gap analysis + Probability in parallel
  const [gapRes, probRes] = await Promise.allSettled([
    analyzeGaps(goal, circumstances),
    calculateProbability(goal, circumstances, defaultGapAnalysis(), profile),
  ]);

  const gapAnalysis = gapRes.status === 'fulfilled' ? gapRes.value : defaultGapAnalysis();
  const probability  = probRes.status === 'fulfilled' ? probRes.value : defaultProbability();

  // Wave 3: Sprints only if probability >= 95% and caller requests it
  let sprints: GPSSprint[] = [];
  let totalWeeks = circumstances.time.realisticTimelineWeeks;
  let criticalPath: string[] = [];

  if (probability.meetsThreshold && opts.generateSprints) {
    const sprintResult = await generateSprints(goal, circumstances, probability, profile);
    sprints = sprintResult.sprints ?? [];
    totalWeeks = sprintResult.totalWeeks ?? totalWeeks;
    criticalPath = sprintResult.criticalPath ?? [];
  }

  return {
    circumstances,
    gapAnalysis,
    probability,
    sprints,
    totalWeeks,
    criticalPath,
    scenarioImpacts: {
      ifFundingFails: circumstances.funding.gap > 0
        ? `Funding gap of $${circumstances.funding.gap} could delay ${gapAnalysis.gaps.find(g => g.dimension === 'funding')?.estimatedTimeToFillWeeks ?? 4} weeks without an alternative source.`
        : 'Funding is aligned — minimal impact if one source shifts.',
      ifTeamMemberJoins: circumstances.team.rolesNeeded.length > 0
        ? `Adding a ${circumstances.team.rolesNeeded[0]?.role} via Trading Post could cut timeline by 20–30%.`
        : 'Solo-completable — team additions are a bonus.',
      ifSkillGapFilled: circumstances.skills.gap.length > 0
        ? `Closing skill gaps (${circumstances.skills.gap.slice(0, 2).join(', ')}) adds ${gapAnalysis.gaps.find(g => g.dimension === 'skills')?.probabilityImpact ?? 10}% to probability.`
        : 'Skills are aligned — no major gaps to close.',
    },
  };
}
