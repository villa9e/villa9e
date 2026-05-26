import Link from 'next/link';

export const metadata = { title: 'Privacy Policy — villa9e', description: 'How villa9e handles your data' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="text-village-blue text-sm mb-8 inline-block">← Back to villa9e</Link>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Effective: May 2026 · Powered by Legaci Jackson</p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. What We Collect</h2>
            <p>villa9e collects information you provide directly (name, email, goals, skills), information from your use of the app (goal progress, posts, OoWops), and optionally, data you choose to share through the Data Locker for monetization purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. How We Use Your Data</h2>
            <p>Your data powers the Goal GPS engine, Spirit AI coaching, and villager matching. We use aggregated, anonymized data to improve villa9e. We never sell your individual data to third parties. If you opt into the Data Locker, advertisers receive only the categories you approve — never your identity.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Health Data (Hospital)</h2>
            <p>Health and wellness data shared through the Hospital section is stored separately with enhanced security. villa9e maintains a HIPAA Business Associate Agreement (BAA) with our data processor. Health data is never used for advertising without explicit separate consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Children (COPPA)</h2>
            <p>villa9e is available to users 13 and older. Users under 13 are not permitted. Users 13–17 require parental consent. We do not knowingly collect data from children under 13. If you believe a child under 13 has provided us data, contact us at <a href="mailto:privacy@villa9e.app" className="text-village-blue">privacy@villa9e.app</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Data Locker — Your Control</h2>
            <p>The Data Locker is locked by default. You choose exactly what data categories to share and earn 15% of what your data generates. You can change settings at any time. Revoking consent stops future use immediately — historical aggregated data cannot be retroactively removed from existing campaigns.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. $VLG Token & Wallet</h2>
            <p>In Phase 1, $VLG is a points system and not a financial instrument. Your wallet data is stored securely and never shared with third parties. When $VLG becomes tradeable in Phase 3, additional terms will apply.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Third-Party Services</h2>
            <p>villa9e uses Supabase (data storage), Stripe (payments), Cloudinary (media), ElevenLabs (voice), and other services. Each operates under their own privacy policies. Payments are processed by Stripe and villa9e never stores your full card details.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Your Rights</h2>
            <p>You may request export, correction, or deletion of your data at any time. Contact <a href="mailto:privacy@villa9e.app" className="text-village-blue">privacy@villa9e.app</a>. We will respond within 30 days. Deleting your account removes your profile and personal data; community content (anonymized OoWops, aggregated data) may remain.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">9. Security</h2>
            <p>We use industry-standard encryption (TLS in transit, AES-256 at rest), row-level security in our database, and regular security reviews. No system is 100% secure — if you discover a vulnerability, please report it to <a href="mailto:security@villa9e.app" className="text-village-blue">security@villa9e.app</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">10. Contact</h2>
            <p>Legaci Jackson LLC · <a href="mailto:privacy@villa9e.app" className="text-village-blue">privacy@villa9e.app</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
