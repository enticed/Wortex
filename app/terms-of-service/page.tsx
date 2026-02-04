'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Last Updated: February 3, 2026
            </p>

            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                1. Agreement to Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you and Today Smart Solutions, LLC (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), operator of the Wortex website and game service located at wortex.live (the &quot;Service&quot;).
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Service.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                2. Eligibility
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                You must be at least 13 years old to use the Service. By using the Service, you represent and warrant that:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>You are at least 13 years of age</li>
                <li>You have the legal capacity to enter into these Terms</li>
                <li>You will comply with these Terms and all applicable laws and regulations</li>
                <li>All information you provide is accurate and current</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400">
                If you are under 18 years of age, you represent that your parent or guardian has reviewed and agreed to these Terms on your behalf.
              </p>
            </section>

            {/* Account Registration */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                3. Account Registration and Security
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Anonymous Use
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                You may use the Service without creating an account. However, certain features such as saving progress, viewing statistics, and appearing on leaderboards require account registration.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Account Creation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                To create an account, you must provide accurate and complete information. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access or security breach</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Username Requirements
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                You may not use a username that:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Is offensive, vulgar, or obscene</li>
                <li>Infringes upon intellectual property rights</li>
                <li>Impersonates another person or entity</li>
                <li>Contains misleading or deceptive information</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400">
                We reserve the right to remove or modify usernames that violate these requirements.
              </p>
            </section>

            {/* Use of the Service */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                4. Acceptable Use
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li>Use the Service in any way that violates applicable laws or regulations</li>
                <li>Use cheats, exploits, automation software, bots, hacks, or any unauthorized third-party software to modify or interfere with the Service</li>
                <li>Attempt to gain unauthorized access to any portion of the Service, other users&apos; accounts, or systems or networks connected to the Service</li>
                <li>Use the Service to transmit viruses, malware, or other malicious code</li>
                <li>Harass, abuse, threaten, or intimidate other users</li>
                <li>Collect or harvest any information from other users without their consent</li>
                <li>Impersonate any person or entity or falsely state or misrepresent your affiliation with any person or entity</li>
                <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                <li>Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code of the Service</li>
                <li>Use any automated system to access the Service in a manner that sends more request messages than a human can reasonably produce in the same period</li>
                <li>Remove, circumvent, disable, damage, or otherwise interfere with security-related features of the Service</li>
                <li>Use the Service for any commercial purpose without our express written permission</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                5. Intellectual Property Rights
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Our Content
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                The Service and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, audio, and the design, selection, and arrangement thereof) are owned by Today Smart Solutions, LLC and are protected by copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Puzzle Content
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Puzzles in Wortex feature famous quotations that are in the public domain. While the quotations themselves are public domain, our selection, arrangement, presentation, and the accompanying hint phrases constitute our original creative work.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Limited License
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for personal, non-commercial purposes. This license does not include:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Any right to reproduce, distribute, or create derivative works</li>
                <li>Any right to use the Service for commercial purposes</li>
                <li>Any right to modify, reverse engineer, or decompile the Service</li>
                <li>Any right to access or use the Service through automated means</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Trademarks
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                &quot;Wortex&quot; and all related logos and graphics are proprietary marks of Today Smart Solutions, LLC. You may not use these marks without our prior written permission.
              </p>
            </section>

            {/* Premium Subscription */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                6. Premium Subscription
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Subscription Terms
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Wortex offers a premium subscription (&quot;Premium&quot;) that provides additional features including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Ad-free experience</li>
                <li>Access to puzzle archives</li>
                <li>Additional game features</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Billing and Payment
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Premium subscriptions are billed on a recurring basis (monthly or annually). By subscribing, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Provide accurate and complete payment information</li>
                <li>Pay all fees and charges associated with your subscription</li>
                <li>Authorize recurring charges to your payment method</li>
                <li>Be responsible for all taxes and fees applicable to your subscription</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Payment processing is handled by Stripe. Your payment information is subject to Stripe&apos;s terms and privacy policy.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Automatic Renewal
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Your subscription will automatically renew at the end of each billing period unless you cancel before the renewal date. You will be charged the then-current subscription fee.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Cancellation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                You may cancel your Premium subscription at any time through your Account Settings. Cancellation will take effect at the end of your current billing period. You will retain access to Premium features until the end of the paid period. No refunds will be provided for partial billing periods.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Price Changes
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We reserve the right to change subscription prices at any time. Price changes will apply to future billing periods and will be communicated to you at least 30 days in advance.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Refunds
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All subscription fees are non-refundable except as required by law or as expressly stated in these Terms. If you believe you are entitled to a refund, please contact us at support@wortex.live.
              </p>
            </section>

            {/* User Content */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                7. User-Generated Content
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Currently, the Service allows limited user-generated content in the form of usernames and profile information. By providing such content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display your username in connection with the Service (e.g., on leaderboards).
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                You retain all ownership rights to any content you provide, but you are responsible for ensuring that your content does not violate these Terms or any applicable laws.
              </p>
            </section>

            {/* Third-Party Links */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                8. Third-Party Links and Services
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                The Service may contain links to third-party websites or services (including payment processors and advertising networks) that are not owned or controlled by Today Smart Solutions, LLC. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                You acknowledge and agree that Today Smart Solutions, LLC shall not be responsible or liable for any damage or loss caused by or in connection with your use of any third-party websites or services.
              </p>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                9. Disclaimers and Warranties
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3 uppercase font-semibold">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                To the fullest extent permitted by law, Today Smart Solutions, LLC disclaims all warranties, express or implied, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Implied warranties of merchantability, fitness for a particular purpose, and non-infringement</li>
                <li>Warranties that the Service will be uninterrupted, error-free, or secure</li>
                <li>Warranties regarding the accuracy, reliability, or completeness of the Service</li>
                <li>Warranties that defects will be corrected</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400">
                We do not warrant that the Service will meet your requirements or that results obtained from the use of the Service will be accurate or reliable.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                10. Limitation of Liability
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3 uppercase font-semibold">
                TO THE FULLEST EXTENT PERMITTED BY LAW, TODAY SMART SOLUTIONS, LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Our total liability to you for all claims arising out of or relating to these Terms or the Service shall not exceed the greater of:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>The amount you paid to us in the 12 months preceding the claim, or</li>
                <li>$100 USD</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400">
                Some jurisdictions do not allow the exclusion or limitation of certain damages, so the above limitations may not apply to you in whole or in part.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                11. Indemnification
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                You agree to indemnify, defend, and hold harmless Today Smart Solutions, LLC and its officers, directors, employees, contractors, agents, licensors, and suppliers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys&apos; fees) arising out of or relating to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4">
                <li>Your violation of these Terms</li>
                <li>Your use of the Service</li>
                <li>Your violation of any rights of another party</li>
                <li>Your violation of any applicable laws or regulations</li>
              </ul>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                12. Termination
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Violation of these Terms</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Extended periods of inactivity</li>
                <li>At your request</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                You may terminate your account at any time by deleting your account through Account Settings or by contacting us.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Upon termination, your right to use the Service will immediately cease. All provisions of these Terms that by their nature should survive termination shall survive, including but not limited to ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                13. Dispute Resolution and Arbitration
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Informal Resolution
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                If you have a dispute with us, you agree to first contact us at legal@wortex.live and attempt to resolve the dispute informally. We will attempt to resolve the dispute within 60 days.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Governing Law
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Today Smart Solutions, LLC is registered, without regard to its conflict of law provisions.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Class Action Waiver
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action. You waive any right to participate in a class action lawsuit or class-wide arbitration.
              </p>
            </section>

            {/* General Provisions */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                14. General Provisions
              </h2>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Entire Agreement
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and Today Smart Solutions, LLC regarding the Service and supersede all prior agreements and understandings.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Severability
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Waiver
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. Any waiver must be in writing and signed by us.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Assignment
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                You may not assign or transfer these Terms or your rights hereunder without our prior written consent. We may assign these Terms without restriction.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Force Majeure
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                15. Contact Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-gray-700 dark:text-gray-300">
                <p className="mb-2"><strong>Company:</strong> Today Smart Solutions, LLC</p>
                <p className="mb-2"><strong>Email:</strong> legal@wortex.live</p>
                <p className="mb-2"><strong>Support:</strong> support@wortex.live</p>
                <p className="mb-2"><strong>Website:</strong> <a href="https://wortex.live" className="text-blue-600 dark:text-blue-400 hover:underline">https://wortex.live</a></p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  <strong>By using Wortex, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
