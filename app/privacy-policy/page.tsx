'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pt-16">
        <div className="max-w-4xl mx-auto relative">
          {/* Close Button */}
          <button
            onClick={() => router.push('/')}
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Privacy Policy
          </h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Last Updated: February 3, 2026
            </p>

            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Introduction
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Welcome to Wortex, operated by Today Smart Solutions, LLC (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and game service at wortex.live.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Please read this Privacy Policy carefully. By accessing or using Wortex, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with this policy, please do not use our service.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Information We Collect
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                1. Account Information
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                When you create an account, we collect:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Email address</li>
                <li>Username (display name)</li>
                <li>Password (stored securely in encrypted form)</li>
                <li>Account creation date</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                2. Game Activity Data
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                To provide game features and track your progress, we collect:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Game scores and completion times</li>
                <li>Puzzle dates and completion status</li>
                <li>Statistics (total games played, average scores, streaks)</li>
                <li>Leaderboard rankings</li>
                <li>Preference settings (vortex speed, tutorial completion status)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                3. Payment Information (Premium Users)
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                If you subscribe to Wortex Premium, payment processing is handled securely by Stripe. We do not store your full credit card information. We receive and store:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Subscription status and tier</li>
                <li>Subscription start and end dates</li>
                <li>Last four digits of payment card (for reference)</li>
                <li>Stripe customer ID (for subscription management)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                4. Usage and Technical Data
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We automatically collect certain information when you use Wortex:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Browser type and version</li>
                <li>Device type and operating system</li>
                <li>IP address and general location (country/region)</li>
                <li>Pages visited and features used</li>
                <li>Time zone and language preferences</li>
                <li>Referral source</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                5. Anonymous Play
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Users can play Wortex without creating an account. For anonymous users, we only collect:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Session-based game progress (stored locally in your browser)</li>
                <li>Basic technical data as described above</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400">
                This data is not linked to your identity and cannot be used to identify you personally.
              </p>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                How We Use Your Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li><strong>Provide and maintain the service:</strong> Process game play, save progress, track scores, and display leaderboards</li>
                <li><strong>Manage your account:</strong> Authenticate users, manage subscriptions, and provide customer support</li>
                <li><strong>Personalize experience:</strong> Remember your preferences, maintain game streaks, and show relevant statistics</li>
                <li><strong>Improve the service:</strong> Analyze usage patterns to fix bugs, develop new features, and optimize performance</li>
                <li><strong>Communicate with you:</strong> Send service-related notifications, respond to inquiries, and provide updates (we do not send marketing emails unless you opt in)</li>
                <li><strong>Process payments:</strong> Handle subscriptions and billing through our payment processor Stripe</li>
                <li><strong>Ensure security:</strong> Detect and prevent fraud, abuse, and security threats</li>
                <li><strong>Display advertising:</strong> Show relevant ads through Google AdSense (see Advertising section below)</li>
              </ul>
            </section>

            {/* Advertising and Third-Party Services */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Advertising and Third-Party Services
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Google AdSense
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We use Google AdSense to display advertisements on our website. Google uses cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Serve ads based on your prior visits to our site and other sites</li>
                <li>Provide personalized advertising based on your interests</li>
                <li>Measure ad performance and effectiveness</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Ads Settings</a> or <a href="http://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">www.aboutads.info</a>.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Premium subscribers do not see advertisements.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Stripe
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Payment processing is handled by Stripe, Inc. When you subscribe to Premium, you are providing your payment information directly to Stripe, subject to <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Stripe&apos;s Privacy Policy</a>.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Supabase
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Our database and authentication services are provided by Supabase. User data is stored securely and is subject to <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Supabase&apos;s Privacy Policy</a>.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Cookies and Tracking Technologies
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We use cookies and similar tracking technologies to track activity on our service and store certain information. Cookies are files with small amounts of data that are stored on your device.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Essential Cookies
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                These cookies are necessary for the service to function:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Authentication cookies (maintain your logged-in status)</li>
                <li>Session cookies (track game progress during a session)</li>
                <li>Preference cookies (remember your settings)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Analytics and Performance Cookies
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                These cookies help us understand how visitors interact with our website:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Usage statistics (pages visited, time spent, features used)</li>
                <li>Performance monitoring (load times, errors)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Advertising Cookies
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Google AdSense uses cookies to deliver personalized ads. You can control these through your browser settings or opt out via the links provided in the Advertising section above.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Data Retention
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We retain your information for as long as necessary to provide the service and fulfill the purposes outlined in this Privacy Policy:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li><strong>Account data:</strong> Retained until you delete your account</li>
                <li><strong>Game history and scores:</strong> Retained as part of your account and leaderboard records</li>
                <li><strong>Payment records:</strong> Retained for 7 years for tax and legal compliance</li>
                <li><strong>Anonymous usage data:</strong> Aggregated data may be retained indefinitely for analytical purposes</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-3">
                When you delete your account, we remove or anonymize your personal information within 30 days, except where we are required by law to retain it longer.
              </p>
            </section>

            {/* Your Privacy Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Your Privacy Rights
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
                <li><strong>Portability:</strong> Receive your data in a structured, commonly used format</li>
                <li><strong>Objection:</strong> Object to processing of your information for certain purposes</li>
                <li><strong>Restriction:</strong> Request that we limit how we use your information</li>
                <li><strong>Withdrawal of consent:</strong> Withdraw consent for data processing where consent was the legal basis</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                To exercise these rights, you can:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                <li>Update your profile information in the Account Settings page</li>
                <li>Delete your account through Account Settings</li>
                <li>Contact us directly at the email provided below</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Data Security
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Passwords are encrypted using industry-standard hashing algorithms</li>
                <li>Data transmission is secured using SSL/TLS encryption</li>
                <li>Access to personal information is restricted to authorized personnel only</li>
                <li>Payment information is processed through PCI-compliant payment processors</li>
                <li>Regular security audits and updates</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400">
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Children&apos;s Privacy
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Wortex is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will delete such information from our systems.
              </p>
            </section>

            {/* International Data Transfers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                International Data Transfers
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from the laws of your country. By using Wortex, you consent to the transfer of your information to these countries.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards, such as standard contractual clauses approved by relevant authorities.
              </p>
            </section>

            {/* Changes to This Privacy Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Changes to This Privacy Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Posting the updated Privacy Policy on this page</li>
                <li>Updating the &quot;Last Updated&quot; date at the top</li>
                <li>Sending you an email notification (if you have an account)</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400">
                Your continued use of Wortex after changes are posted constitutes your acceptance of the updated Privacy Policy.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Contact Us
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-gray-700 dark:text-gray-300">
                <p className="mb-2"><strong>Company:</strong> Today Smart Solutions, LLC</p>
                <p className="mb-2"><strong>Email:</strong> privacy@wortex.live</p>
                <p className="mb-2"><strong>Website:</strong> <a href="https://wortex.live" className="text-blue-600 dark:text-blue-400 hover:underline">https://wortex.live</a></p>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-3">
                We will respond to your inquiry within 30 days.
              </p>
            </section>

            {/* GDPR and CCPA Specific Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Additional Information for EU and California Residents
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                EU Residents (GDPR)
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                If you are located in the European Economic Area (EEA), the data controller of your personal information is Today Smart Solutions, LLC. The legal basis for processing your information includes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li><strong>Contractual necessity:</strong> To provide the service you have requested</li>
                <li><strong>Legitimate interests:</strong> To improve our service, prevent fraud, and ensure security</li>
                <li><strong>Consent:</strong> For advertising and marketing communications (where applicable)</li>
                <li><strong>Legal obligation:</strong> To comply with applicable laws and regulations</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                California Residents (CCPA)
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Right to know what personal information is collected, used, shared, or sold</li>
                <li>Right to delete personal information held by us</li>
                <li>Right to opt-out of sale of personal information (we do not sell your information)</li>
                <li>Right to non-discrimination for exercising your privacy rights</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400">
                To exercise these rights, please contact us using the information provided in the Contact Us section.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
