/**
 * villa9e bootstrap script
 * Creates test user + seed users with realistic profiles, posts, goals, and interactions.
 *
 * Run:
 *   node scripts/bootstrap.mjs
 *
 * Prerequisites:
 *   1. Run migration 032 in Supabase SQL editor first.
 *   2. Node 18+ required (built-in fetch).
 */

const SUPABASE_URL  = 'https://zjhsggnmwvwlhiocmfrn.supabase.co';
const SERVICE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaHNnZ25td3Z3bGhpb2NtZnJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY4MjExMiwiZXhwIjoyMDk1MjU4MTEyfQ._Ixgan5QUE8m-jEzZxpb5vM7RGmyvZveewRUrr00XgI';

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function adminPost(path, body) {
  const r = await fetch(`${SUPABASE_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await r.text();
  if (!r.ok) throw new Error(`POST ${path} → ${r.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function dbInsert(table, rows) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation,resolution=ignore-duplicates' },
    body: JSON.stringify(rows),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`INSERT ${table} → ${r.status}: ${text}`);
  return text ? JSON.parse(text) : [];
}

async function dbUpsert(table, rows, onConflict) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify(rows),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`UPSERT ${table} → ${r.status}: ${text}`);
  return text ? JSON.parse(text) : [];
}

async function createUser(email, password, username, displayName, personalityType) {
  console.log(`  Creating user: ${email}...`);
  try {
    const data = await adminPost('/auth/v1/admin/users', {
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: displayName },
    });
    console.log(`  ✓ Created: ${email} (id: ${data.id})`);
    return data;
  } catch (e) {
    if (e.message.includes('already been registered') || e.message.includes('already exists')) {
      // Fetch existing user
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, { headers });
      const data = await r.json();
      const user = data?.users?.[0];
      if (user) {
        console.log(`  ~ Already exists: ${email} (id: ${user.id})`);
        return user;
      }
    }
    throw e;
  }
}

async function ensureProfile(userId, username, displayName, personalityType, bio, occupation, score) {
  await dbUpsert('profiles', [{
    id: userId,
    username,
    display_name: displayName,
    personality_type: personalityType,
    bio,
    occupation,
    village_score: score,
    score_tier: score >= 5000 ? 'architect' : score >= 1000 ? 'builder' : 'seedling',
    checkin_streak: Math.floor(Math.random() * 30),
    is_founding_villager: true,
    founding_villager_number: Math.floor(Math.random() * 100) + 1,
  }], 'id');
}

async function ensureWallet(userId, vlgBalance) {
  await dbUpsert('village_wallets', [{
    user_id: userId,
    vlg_balance: vlgBalance,
    total_earned_vlg: vlgBalance * 1.4,
  }], 'user_id');
}

async function ensureXp(userId, xp, level) {
  await dbUpsert('user_xp', [{
    user_id: userId,
    xp,
    level,
  }], 'user_id');
}

// ─── Seed users ───────────────────────────────────────────────────────────────

const SEED_USERS = [
  {
    email:    'testuser@villa9e.app',
    password: 'TestVilla9e2026!',
    username: 'testvillager',
    display:  'Test Villager',
    type:     'architect',
    bio:      'Building goals one step at a time. Testing the village.',
    occ:      'Product Manager',
    score:    1500,
    vlg:      250,
    xp:       800,
    level:    3,
  },
  {
    email:    'maya.rivers@villa9e.app',
    password: 'Village2026!',
    username: 'maya_rivers',
    display:  'Maya Rivers',
    type:     'spark',
    bio:      'Creative director & entrepreneur. Chasing dreams with a plan.',
    occ:      'Creative Director',
    score:    4200,
    vlg:      880,
    xp:       2400,
    level:    6,
  },
  {
    email:    'darius.knox@villa9e.app',
    password: 'Village2026!',
    username: 'darius_knox',
    display:  'Darius Knox',
    type:     'anchor',
    bio:      'Fitness coach helping people build strength inside and out.',
    occ:      'Personal Trainer',
    score:    3100,
    vlg:      620,
    xp:       1800,
    level:    5,
  },
  {
    email:    'priya.sharma@villa9e.app',
    password: 'Village2026!',
    username: 'priya_sha',
    display:  'Priya Sharma',
    type:     'compass',
    bio:      'Software engineer building for impact. Goal GPS believer.',
    occ:      'Software Engineer',
    score:    5800,
    vlg:      1200,
    xp:       3600,
    level:    8,
  },
  {
    email:    'jordan.bell@villa9e.app',
    password: 'Village2026!',
    username: 'jordanbell',
    display:  'Jordan Bell',
    type:     'pioneer',
    bio:      'Musician & content creator. Documenting the journey.',
    occ:      'Musician',
    score:    2700,
    vlg:      540,
    xp:       1500,
    level:    4,
  },
  {
    email:    'amara.osei@villa9e.app',
    password: 'Village2026!',
    username: 'amara_osei',
    display:  'Amara Osei',
    type:     'weaver',
    bio:      'Community organizer building real connections across the village.',
    occ:      'Community Organizer',
    score:    6500,
    vlg:      1400,
    xp:       4200,
    level:    9,
  },
];

// ─── Goals and steps seed ─────────────────────────────────────────────────────

const GOAL_SEEDS = [
  {
    title:       'Launch my first online course',
    category:    'Business',
    description: 'Create and sell a course on my area of expertise within 90 days.',
    steps: [
      { title: 'Define course topic and audience',   description: 'Research who needs your knowledge most. Define ICP.' },
      { title: 'Outline 5 core modules',              description: 'Write a detailed content outline for each module.' },
      { title: 'Record module 1 videos',              description: 'Set up recording environment. Script, record, edit.' },
      { title: 'Build course landing page',           description: 'Create sales page with compelling copy and CTA.' },
      { title: 'Launch beta to 10 students',          description: 'Sell at 50% discount to gather feedback and testimonials.' },
    ],
  },
  {
    title:       'Run a half marathon',
    category:    'Health & Fitness',
    description: '12-week training plan culminating in a local half marathon race.',
    steps: [
      { title: 'Get a physical and baseline run test', description: 'See doctor and measure current mile pace.' },
      { title: 'Complete week 1-4 base building',      description: 'Three 30-min easy runs per week, build aerobic base.' },
      { title: 'Complete weeks 5-8 tempo runs',        description: 'Add one weekly tempo run + long run day (8-10 miles).' },
      { title: 'Register for race',                    description: 'Pick a race date 12+ weeks out. Register and pay.' },
      { title: 'Run the half marathon',                description: 'Race day. Trust the training. Finish line.' },
    ],
  },
  {
    title:       'Save $10,000 emergency fund',
    category:    'Finance',
    description: 'Build a 6-month emergency fund over 18 months through disciplined saving.',
    steps: [
      { title: 'Audit current spending',     description: 'Track every dollar spent last 30 days using budgeting app.' },
      { title: 'Cut 3 non-essential expenses', description: 'Cancel or reduce subscriptions, dining out, and impulse purchases.' },
      { title: 'Open dedicated savings account', description: 'High-yield savings account, separate from checking.' },
      { title: 'Automate $555/month transfer', description: 'Set recurring auto-transfer on payday so saving is invisible.' },
      { title: 'Reach $5,000 milestone',     description: 'Celebrate hitting the halfway point. Reassess and adjust.' },
    ],
  },
];

// ─── Studio posts seed ────────────────────────────────────────────────────────

const POST_CAPTIONS = [
  "Day 14 of building in public. The hardest part isn't the work — it's the silence before momentum kicks in. Keep going.",
  "Just hit 3 months of consistent workouts. If you told me 90 days ago I'd be here, I wouldn't have believed you. The village keeps me accountable.",
  "Reminder: your goals don't care about your mood. Show up anyway. #GPS #MindsetShift",
  "Course launch update: 8 students enrolled in the beta. First feedback just came in — they love module 2. We're building something real here.",
  "The GPS feature is literally changing how I think about my goals. No more vague intentions. Just probability scores and sprint plans. Try it.",
  "Every OoWop I give costs me nothing and means everything to someone building their dream. Give freely.",
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏕️  villa9e bootstrap starting...\n');

  const createdUsers = [];

  // Step 1: Create auth users
  console.log('► Step 1: Create auth users');
  for (const u of SEED_USERS) {
    try {
      const authUser = await createUser(u.email, u.password, u.username, u.display, u.type);
      createdUsers.push({ ...u, id: authUser.id });
    } catch (e) {
      console.error(`  ✗ Failed ${u.email}: ${e.message}`);
    }
  }

  console.log('\n► Step 2: Seed profiles, wallets, and XP');
  for (const u of createdUsers) {
    try {
      await ensureProfile(u.id, u.username, u.display, u.type, u.bio, u.occ, u.score);
      await ensureWallet(u.id, u.vlg);
      await ensureXp(u.id, u.xp, u.level);
      console.log(`  ✓ Profile seeded: @${u.username}`);
    } catch (e) {
      console.error(`  ✗ Profile failed @${u.username}: ${e.message}`);
    }
  }

  console.log('\n► Step 3: Seed goals and steps');
  const goalIds = [];
  for (let i = 0; i < createdUsers.length && i < GOAL_SEEDS.length; i++) {
    const u = createdUsers[i];
    const g = GOAL_SEEDS[i % GOAL_SEEDS.length];
    try {
      const [goal] = await dbUpsert('goals', [{
        user_id:           u.id,
        title:             g.title,
        category:          g.category,
        description:       g.description,
        status:            'active',
        gps_stage:         'active',
        probability_score: 72 + Math.floor(Math.random() * 25),
        progress_percentage: Math.floor(Math.random() * 60),
        pace_level:        2,
        visibility:        'public',
      }], 'id');
      goalIds.push(goal.id);

      // Insert steps
      const stepRows = g.steps.map((s, idx) => ({
        goal_id:           goal.id,
        title:             s.title,
        description:       s.description,
        step_number:       idx + 1,
        status:            idx === 0 ? 'in_progress' : 'pending',
        resource_category: 'general',
      }));
      await dbInsert('goal_steps', stepRows);
      console.log(`  ✓ Goal + ${g.steps.length} steps: "${g.title}" for @${u.username}`);
    } catch (e) {
      console.error(`  ✗ Goal failed for @${u.username}: ${e.message}`);
    }
  }

  console.log('\n► Step 4: Seed studio posts (Dream Line content)');
  const postIds = [];
  for (let i = 0; i < createdUsers.length; i++) {
    const u = createdUsers[i];
    const caption = POST_CAPTIONS[i % POST_CAPTIONS.length];
    try {
      const [post] = await dbInsert('studio_posts', [{
        user_id:      u.id,
        content_type: 'text',
        caption,
        visibility:   'everyone',
        status:       'published',
        has_affiliate: false,
        is_ad:        false,
        oowop_count:  Math.floor(Math.random() * 40),
        comment_count: Math.floor(Math.random() * 12),
        favorite_count: Math.floor(Math.random() * 20),
        published_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      }]);
      postIds.push({ id: post.id, userId: u.id });
      console.log(`  ✓ Post by @${u.username}`);
    } catch (e) {
      console.error(`  ✗ Post failed @${u.username}: ${e.message}`);
    }
  }

  console.log('\n► Step 5: Seed OoWops between users');
  let oowopCount = 0;
  for (let i = 0; i < postIds.length; i++) {
    const post = postIds[i];
    // 2-3 random users give OoWops to each post
    const givers = createdUsers.filter(u => u.id !== post.userId).slice(0, 3);
    for (const giver of givers) {
      try {
        await dbInsert('post_oowops', [{
          post_id:  post.id,
          user_id:  giver.id,
        }]);
        oowopCount++;
      } catch (e) {
        // Ignore duplicate constraint violations — that's fine
      }
    }
  }
  console.log(`  ✓ ${oowopCount} OoWops seeded`);

  console.log('\n► Step 6: Seed skills');
  const SKILLS = [
    ['Leadership', 8], ['Public Speaking', 7], ['Product Management', 9],
    ['Fitness Coaching', 9], ['Nutrition', 7], ['React Development', 9],
    ['Python', 8], ['UI/UX Design', 7], ['Music Production', 8],
    ['Community Building', 9], ['Grant Writing', 7], ['Financial Planning', 8],
  ];
  let skillCount = 0;
  for (let i = 0; i < createdUsers.length; i++) {
    const u = createdUsers[i];
    const userSkills = SKILLS.slice(i * 2, i * 2 + 2);
    for (const [name, rating] of userSkills) {
      try {
        await dbInsert('user_skills', [{
          user_id:    u.id,
          skill_name: name,
          rating,
          is_verified: rating >= 9,
        }]);
        skillCount++;
      } catch (e) { /* ignore duplicates */ }
    }
  }
  console.log(`  ✓ ${skillCount} skills seeded`);

  console.log('\n✅ Bootstrap complete!\n');
  console.log('Users created:');
  for (const u of createdUsers) {
    console.log(`  ${u.email} / ${u.password}  (@${u.username})`);
  }
  console.log('\nNext steps:');
  console.log('  1. Run migration 032 in Supabase SQL editor (supabase/migrations/032_fix_trigger_and_bootstrap.sql)');
  console.log('  2. Run Playwright tests: node scripts/run-tests.mjs');
  console.log('  3. Visit https://villa9e.vercel.app and log in as testuser@villa9e.app\n');
}

main().catch(e => { console.error('\n✗ Fatal:', e.message); process.exit(1); });
