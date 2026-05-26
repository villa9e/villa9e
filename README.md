# villa9e — It takes a village.

**villa9e** is a GPS system for your goals, powered by AI and validated by community. Built by Legaci Jackson.

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **AI**: Anthropic Claude API (claude-sonnet-4-6)
- **3D Map**: Three.js / @react-three/fiber
- **Payments**: Stripe
- **Voice**: ElevenLabs TTS
- **Analytics**: PostHog
- **Push**: OneSignal

## Setup

```bash
npm install
cp .env.local.example .env.local  # Fill in your keys
npm run dev
```

## Environment Variables

See `.env.local` for all required keys:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `ELEVENLABS_API_KEY`
- `OPENWEATHER_API_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY` (optional — analytics)
- `NEXT_PUBLIC_ONESIGNAL_APP_ID` (optional — push notifications)

## Database Setup

1. Create a Supabase project
2. Run `supabase/schema.sql` in the SQL editor
3. Run `supabase/migrations/002_missing_tables.sql`

## 8 Village Locations

| Location | Description |
|----------|-------------|
| 🔨 Workshop | Goal GPS Engine — set goals, AI analysis, step tracking |
| ✨ Dream Line | Social feed — share progress, give OoWops |
| 🏦 Bank | VLG Wallet, crowdfunding, financing |
| 🤝 Trading Post | Skills marketplace — barter, hire, network |
| 👥 Tribes | Project teams — chat, tasks, meetings |
| 📅 Spaces | Events — Spirit prep, AI agenda, calendar sync |
| 🌿 Zen | Wellness — mood, Spirit coaching, journaling |
| 🏥 Hospital | Licensed providers — NPI verified, HIPAA compliant |

## Key Features

- **Goal GPS**: Claude AI analyzes your goal → builds step-by-step plan + probability score
- **OoWop System**: Community validation mechanic — 3 OoWops validates a completed step
- **$VLG Token**: Phase 1 non-tradeable points → converts to real token at Phase 3 (50k+ users)
- **Village Score**: 5 tiers (Seedling → Legend) with multipliers and decay
- **Founding Villager**: First 1,000 get NFT, 500 $VLG bonus, 1.25× multiplier
- **Goal DNA**: Clone proven blueprints from completed goals
- **Personality Maze**: 8 archetypes matched by AI

## Deployment

Deploy to Vercel:
```bash
vercel --prod
```

Set all environment variables in Vercel dashboard.

---

*Built with Claude AI · Powered by Legaci Jackson*
