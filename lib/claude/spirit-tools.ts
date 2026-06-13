import type { SupabaseClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// SPIRIT TOOL REGISTRY — Phase 2 of SPIRIT_OS_SPEC.md (Unified API Fabric)
//
// Each tool is a thin wrapper around villa9e's own internal data model, given
// to Claude via tool use so Spirit can act, not just describe. Every tool has
// a Trust Wall tier:
//
//   0 — read-only, always auto-executed
//   1 — reversible, in-app write, auto-executed + logged to spirit_actions
//   2 — irreversible or visible to others; NOT auto-executed — the handler
//       returns a `pending_confirmation` action for the UI to confirm first
// ─────────────────────────────────────────────────────────────────────────────

export type ToolTier = 0 | 1 | 2;

export interface SpiritToolResult {
  ok: boolean;
  data?: any;
  error?: string;
  pending?: boolean; // true for Tier 2 tools awaiting user confirmation
}

export interface SpiritTool {
  name: string;
  tier: ToolTier;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (admin: SupabaseClient, userId: string, input: any) => Promise<SpiritToolResult>;
}

export const SPIRIT_TOOLS: SpiritTool[] = [
  {
    name: 'create_sprint_action',
    tier: 1,
    description:
      "Add a new action to the user's active sprint for a goal. Use this when the user agrees to take on a new step toward a goal, or when re-planning a sprint that's fallen behind.",
    input_schema: {
      type: 'object',
      properties: {
        goal_id: { type: 'string', description: 'UUID of the goal' },
        title: { type: 'string', description: 'Short, concrete action title' },
        description: { type: 'string', description: 'Optional detail on how to do it' },
        day_of_week: { type: 'integer', description: '1=Mon..7=Sun, omit for "anytime this week"' },
      },
      required: ['goal_id', 'title'],
    },
    handler: async (admin, userId, input) => {
      const { data: sprint } = await admin
        .from('sprints')
        .select('id')
        .eq('user_id', userId)
        .eq('goal_id', input.goal_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as any;

      if (!sprint) return { ok: false, error: 'No active sprint for this goal — create a sprint first.' };

      const { count } = await admin
        .from('sprint_actions')
        .select('id', { count: 'exact', head: true })
        .eq('sprint_id', sprint.id) as any;

      const { data, error } = await admin
        .from('sprint_actions')
        .insert({
          sprint_id: sprint.id,
          title: input.title,
          day_of_week: input.day_of_week ?? null,
          order_index: count ?? 0,
        })
        .select()
        .single() as any;

      if (error) return { ok: false, error: error.message };
      return { ok: true, data: { sprint_id: sprint.id, action: data } };
    },
  },

  {
    name: 'complete_sprint_action',
    tier: 1,
    description:
      "Mark a sprint action as completed or not-completed. Use this when the user tells you they finished (or want to undo finishing) a specific action.",
    input_schema: {
      type: 'object',
      properties: {
        action_id: { type: 'string', description: 'UUID of the sprint_actions row' },
        completed: { type: 'boolean', description: 'true to mark done, false to undo' },
      },
      required: ['action_id', 'completed'],
    },
    handler: async (admin, userId, input) => {
      // Ownership check via the sprints.user_id join
      const { data: action } = await admin
        .from('sprint_actions')
        .select('id, sprint_id, sprints!inner(user_id)')
        .eq('id', input.action_id)
        .single() as any;

      if (!action || action.sprints?.user_id !== userId) {
        return { ok: false, error: 'Action not found.' };
      }

      const { data, error } = await admin
        .from('sprint_actions')
        .update({
          completed: !!input.completed,
          completed_at: input.completed ? new Date().toISOString() : null,
        })
        .eq('id', input.action_id)
        .select()
        .single() as any;

      if (error) return { ok: false, error: error.message };
      return { ok: true, data };
    },
  },

  {
    name: 'create_calendar_event',
    tier: 1,
    description:
      "Create a calendar event in the user's villa9e Spaces calendar (does not touch their external Google Calendar — that requires a separate sync the user triggers). Use this to block time for a goal action, e.g. after re-planning a sprint.",
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        start_time: { type: 'string', description: 'ISO 8601 datetime' },
        end_time: { type: 'string', description: 'ISO 8601 datetime' },
        goal_id: { type: 'string', description: 'Optional UUID of the related goal' },
      },
      required: ['title', 'start_time', 'end_time'],
    },
    handler: async (admin, userId, input) => {
      const { data, error } = await admin
        .from('calendar_events')
        .insert({
          creator_id: userId,
          title: input.title,
          description: input.description ?? null,
          start_time: input.start_time,
          end_time: input.end_time,
          goal_id: input.goal_id ?? null,
        })
        .select()
        .single() as any;

      if (error) return { ok: false, error: error.message };
      return { ok: true, data };
    },
  },

  {
    name: 'send_tribe_message',
    tier: 2,
    description:
      "Send a message to one of the user's tribes on their behalf. Irreversible and visible to others — only call this when the user has explicitly asked you to send a specific message, never proactively.",
    input_schema: {
      type: 'object',
      properties: {
        tribe_id: { type: 'string', description: 'UUID of the tribe' },
        content: { type: 'string', description: 'Message text to send, written as the user' },
      },
      required: ['tribe_id', 'content'],
    },
    // Tier 2 — the tool-use loop in callSpirit() never calls this directly;
    // it queues a pending_confirmation row instead. This handler only runs
    // once the user confirms via /api/spirit/actions/[id].
    handler: async (admin, userId, input) => {
      const { data: membership } = await admin
        .from('tribe_members')
        .select('id')
        .eq('tribe_id', input.tribe_id)
        .eq('user_id', userId)
        .maybeSingle() as any;

      if (!membership) return { ok: false, error: "You're not a member of that tribe." };

      const { data, error } = await admin
        .from('tribe_messages')
        .insert({ tribe_id: input.tribe_id, user_id: userId, content: input.content })
        .select()
        .single() as any;

      if (error) return { ok: false, error: error.message };
      return { ok: true, data };
    },
  },
];

export function getSpiritTool(name: string): SpiritTool | undefined {
  return SPIRIT_TOOLS.find(t => t.name === name);
}

// Anthropic `tools` param shape — strip our extra fields (tier, handler)
export function spiritToolDefinitions() {
  return SPIRIT_TOOLS.map(({ name, description, input_schema }) => ({
    name,
    description,
    input_schema,
  }));
}
