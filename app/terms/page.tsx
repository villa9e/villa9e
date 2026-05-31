import Link from 'next/link';

export const metadata = { title: 'Terms of Service — villa9e', description: 'villa9e Terms of Service' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="text-village-blue text-sm mb-8 inline-block">← Back to villa9e</Link>
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-8">Effective: May 2026 · Powered by Legaci Jackson</p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Acceptance</h2>
            <p>By using villa9e, you agree to these Terms. If you are under 18, your parent or guardian must also agree. If you do not agree, do not use villa9e.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Age Requirements</h2>
            <p>You must be at least 13 years old to use villa9e. Users under 13 are not permitted. Users 13–17 must have parental consent. Certain features (banking, crypto, credit) are available only to users 18+.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Your Account</h2>
            <p>You are responsible for your account and all activity under it. Keep your password secure. You may not create accounts for others without their consent or create multiple accounts to game the system. villa9e reserves the right to suspend accounts that violate these Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Community Standards</h2>
            <p>The Dream Line and all community spaces require respect. Prohibited: hate speech, harassment, threats, illegal content, misinformation, spam, or impersonation. Violations may result in immediate account suspension without notice or refund.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. $VLG Points (Phase 1)</h2>
            <p>In Phase 1, $VLG is a non-transferable, non-tradeable loyalty points system. $VLG has no cash value. villa9e reserves the right to adjust point values, conversion rates, and Phase 3 launch terms. Points may expire after 24 months of account inactivity.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Trading Post & Deals</h2>
            <p>villa9e facilitates connections between buyers and sellers but is not a party to any deal. villa9e earns a platform fee on completed transactions. All disputes between parties are their own responsibility. villa9e may mediate at its discretion but is not obligated to.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Hospital & Health</h2>
            <p>villa9e connects users with healthcare and wellness providers but is not a medical provider. villa9e does not provide medical advice. Healthcare providers on villa9e are independent practitioners, not employees of villa9e. Always consult a licensed professional for medical decisions.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Payments</h2>
            <p>Payments are processed by Stripe. villa9e earns platform fees on transactions as disclosed. Crowdfunding contributions are non-refundable once a campaign ends. Hospital session fees may be refundable if a session is not completed — per provider policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">9. Content You Create</h2>
            <p>You own your content. By posting, you grant villa9e a non-exclusive license to display your content on the platform. You confirm you have the rights to post everything you share. villa9e may remove content that violates these Terms without notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">10. Affiliate & Sponsored Content Disclosure</h2>
            <p>Some posts, videos, and product recommendations on villa9e may be sponsored or may contain affiliate links. When a creator or villa9e earns a commission or has a material connection to content, it will be labeled "Sponsored" in the feed. This disclosure complies with FTC guidelines. Clicking affiliate links may result in villa9e or the creator earning a commission at no additional cost to you.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">11. Limitation of Liability</h2>
            <p>villa9e is provided "as is." To the maximum extent permitted by law, Legaci Jackson LLC is not liable for indirect, incidental, or consequential damages arising from your use of villa9e. Our total liability is limited to amounts you have paid us in the 12 months preceding any claim.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">12. Governing Law</h2>
            <p>These Terms are governed by the laws of the United States. Any disputes will be resolved through binding arbitration, not class action.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">13. Contact</h2>
            <p>Legaci Jackson LLC · <a href="mailto:legal@villa9e.app" className="text-village-blue">legal@villa9e.app</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
