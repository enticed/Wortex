'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
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
            About Wortex
          </h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            {/* Mission */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Our Mission
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Wortex combines the joy of word puzzles with the timeless wisdom of famous quotations. Our mission is to create an engaging daily challenge that exercises your mind, expands your vocabulary, and introduces you to remarkable thoughts from history&apos;s greatest thinkers, writers, and leaders.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Every puzzle is carefully curated to provide not just entertainment, but also educational value—exposing players to culturally significant quotes that have shaped human thought and expression.
              </p>
            </section>

            {/* How Wortex Helps You Learn */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Educational Benefits of Word Puzzles
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Playing Wortex regularly offers multiple cognitive and linguistic benefits:
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                1. Vocabulary Enhancement
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Each puzzle exposes you to diverse vocabulary in context. Famous quotations often employ sophisticated language, literary devices, and archaic terms that expand your vocabulary beyond everyday conversation. By assembling these phrases word by word, you develop a deeper familiarity with word usage and nuance.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                2. Pattern Recognition and Syntax
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                As you reconstruct sentences, you naturally practice recognizing grammatical patterns and sentence structures. This reinforces your understanding of English syntax—the arrangement of words to create well-formed sentences. Over time, this improves your ability to construct clear, effective sentences in your own writing.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                3. Reading Comprehension
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                The Hint Phrase in each puzzle is a rephrasing of the Mystery Quote using different words while retaining the original meaning. This parallel structure teaches an essential reading comprehension skill: recognizing that the same idea can be expressed in multiple ways. Learning to identify semantic equivalence—how different words and phrases can convey the same concept—is crucial for understanding complex texts.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                4. Memory and Cognitive Function
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Research shows that word puzzles and games stimulate cognitive function and may help maintain mental acuity as we age. Wortex specifically exercises your working memory as you track which words belong together, remember the Hint Phrase, and mentally test different arrangements before committing to a solution.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                5. Cultural Literacy
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Famous quotations are cultural touchstones—references that appear in literature, speeches, films, and everyday conversation. By encountering these quotes through Wortex, you build cultural literacy and gain insight into the ideas that have influenced society. Understanding these references enriches your appreciation of arts, literature, and public discourse.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                6. Critical Thinking
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Each puzzle requires strategic thinking: Should you collect all words first or build the phrase incrementally? Which words likely belong together based on grammar and meaning? This decision-making process develops critical thinking skills applicable beyond the game—helping you approach problems methodically and evaluate multiple possible solutions.
              </p>
            </section>

            {/* Quote Selection Process */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                How We Select Quotes
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Our puzzle content is carefully curated according to these principles:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li><strong>Historical Significance:</strong> We prioritize quotes from influential figures in history, literature, science, philosophy, and politics</li>
                <li><strong>Cultural Impact:</strong> Selected quotes have become part of the cultural lexicon and are widely recognized or referenced</li>
                <li><strong>Linguistic Interest:</strong> We favor quotes with interesting vocabulary, clever wordplay, or memorable phrasing that make for engaging puzzles</li>
                <li><strong>Diversity of Sources:</strong> Our collection spans different time periods, cultures, and fields of human achievement</li>
                <li><strong>Educational Value:</strong> Each quote offers insight into human nature, society, wisdom, or creative expression</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400">
                All quotes are from the public domain, ensuring free access to our shared cultural heritage.
              </p>
            </section>

            {/* The Science of Language Learning */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                The Science Behind Language Learning Through Play
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Wortex is designed based on established principles of language acquisition and cognitive psychology:
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Contextual Learning
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Unlike flashcard memorization, Wortex presents words in meaningful contexts—complete sentences that express coherent ideas. Research in linguistics shows that contextual learning is far more effective than rote memorization. When you encounter a word as part of a meaningful phrase, you simultaneously learn its definition, usage, connotations, and relationships with other words.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Active Engagement
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Passive reading provides limited learning benefits compared to active engagement. Wortex requires you to actively manipulate words—dragging, arranging, testing hypotheses. This hands-on interaction creates stronger neural pathways and deeper learning. The physical act of moving words reinforces the mental process of understanding their relationships.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Spaced Repetition
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                By playing daily, you benefit from spaced repetition—repeatedly encountering concepts over time with intervals between exposures. This learning pattern, well-documented in cognitive science, strengthens long-term retention. Daily puzzles provide consistent practice without overwhelming you with too much information at once.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Immediate Feedback
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Wortex provides instant feedback on your progress—words slot into place when correctly positioned, and you immediately see the complete quote upon solving the puzzle. This immediate reinforcement helps you learn from mistakes and solidifies correct patterns in your memory.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Low-Stress Environment
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Learning is most effective when stress is low and motivation is intrinsic. Wortex offers hints to prevent frustration, allows unlimited time (no countdown clock pressure), and frames the experience as an enjoyable daily ritual rather than a high-stakes test. This creates ideal conditions for learning and cognitive development.
              </p>
            </section>

            {/* Game Design Philosophy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Game Design Philosophy
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Wortex&apos;s unique design elements serve both entertainment and educational purposes:
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                The Vortex Mechanic
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Words swirl in a vortex rather than appearing in a static list. This dynamic presentation serves multiple purposes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>It prevents you from relying on word order or position as hints</li>
                <li>The motion captures attention and creates visual interest</li>
                <li>It simulates the chaos of initial confusion before understanding emerges</li>
                <li>Adjustable speed accommodates different cognitive processing speeds and visual preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Two-Phase Structure
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Wortex divides the challenge into two distinct phases:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li><strong>Phase 1 (Word Collection):</strong> Tests word recognition, vocabulary, and the ability to distinguish between similar concepts expressed differently</li>
                <li><strong>Phase 2 (Word Arrangement):</strong> Tests understanding of grammar, sentence structure, and logical flow of ideas</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                This separation allows each phase to target different cognitive skills while building toward a complete linguistic challenge.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Balanced Difficulty
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Each puzzle aims for the optimal difficulty zone—challenging enough to engage your mind, but not so difficult that it becomes frustrating. This &quot;flow state&quot; maximizes both enjoyment and learning. The hint system ensures that you can always make progress, preventing the discouragement that derails learning.
              </p>
            </section>

            {/* Usage in Education */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Wortex in Educational Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Educators and students can benefit from incorporating Wortex into learning routines:
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                English Language Arts
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Teachers can use daily Wortex puzzles as warm-up activities that reinforce grammar, vocabulary, and literary analysis. After solving, students can discuss the quote&apos;s meaning, historical context, and relevance today. This bridges the gap between language mechanics and literary appreciation.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                English as a Second Language (ESL)
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                ESL learners benefit from encountering authentic English in complete sentences. The dual-phase structure scaffolds learning—first identifying words, then understanding their arrangement. The hint phrase provides additional context clues that support comprehension.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                History and Social Studies
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Many Wortex quotes come from historical figures and movements. Teachers can use these quotes as jumping-off points for discussions about historical periods, social change, and the evolution of ideas.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-4">
                Special Education and Accessibility
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Wortex&apos;s visual-kinesthetic approach benefits diverse learners, including those who struggle with traditional text-based learning. The ability to adjust vortex speed, use hints, and work at your own pace makes the game adaptable to different learning needs and styles.
              </p>
            </section>

            {/* Community and Competition */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Community and Friendly Competition
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Wortex features leaderboards and statistics that add a social dimension to learning:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li><strong>Daily Leaderboards:</strong> Compare your performance with other players who solved the same puzzle</li>
                <li><strong>All-Time Rankings:</strong> Track your overall performance across multiple puzzles</li>
                <li><strong>Personal Statistics:</strong> Monitor your improvement over time with detailed stats</li>
                <li><strong>Streak Tracking:</strong> Build consistency by playing daily</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Research shows that social elements and friendly competition can enhance motivation and persistence in learning activities. Leaderboards provide external motivation while statistics offer intrinsic satisfaction from self-improvement.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                However, Wortex emphasizes personal growth over competition. You can play anonymously, focus on your own progress, and enjoy the puzzles without social pressure.
              </p>
            </section>

            {/* The Archive */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                The Growing Archive
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Premium subscribers gain access to our complete archive of past puzzles. This transforms Wortex from a daily activity into an extensive library of learning opportunities:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Practice at your own pace by solving multiple puzzles in one session</li>
                <li>Revisit challenging puzzles to reinforce learning</li>
                <li>Explore puzzles from different historical periods or thematic categories</li>
                <li>Build a comprehensive exposure to famous quotations and cultural references</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400">
                The archive grows daily, creating an ever-expanding educational resource.
              </p>
            </section>

            {/* Research and Development */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Continuous Improvement
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Wortex is continually evolving based on player feedback and ongoing research in educational game design. We regularly:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Expand our collection of quotes to increase diversity and educational value</li>
                <li>Refine puzzle difficulty calibration to maintain optimal challenge levels</li>
                <li>Enhance accessibility features to reach more learners</li>
                <li>Add features that deepen educational impact</li>
                <li>Analyze gameplay data (anonymously) to improve the learning experience</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400">
                We welcome feedback and suggestions from our community of players and educators.
              </p>
            </section>

            {/* Conclusion */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Join the Wortex Community
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Whether you&apos;re a word puzzle enthusiast, a student looking to improve your language skills, an educator seeking engaging classroom resources, or simply someone who enjoys learning something new every day, Wortex offers a unique blend of entertainment and education.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Each puzzle is an opportunity to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4 mb-3">
                <li>Sharpen your linguistic skills</li>
                <li>Discover wisdom from great minds</li>
                <li>Exercise your brain in a fun, low-pressure environment</li>
                <li>Build a daily habit that enriches your vocabulary and cultural knowledge</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400">
                Start your daily Wortex journey today and experience the joy of learning through play!
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Get in Touch
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                We love hearing from our players! Contact us with feedback, questions, or suggestions:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-gray-700 dark:text-gray-300">
                <p className="mb-2"><strong>General Inquiries:</strong> hello@wortex.live</p>
                <p className="mb-2"><strong>Partnerships:</strong> partnerships@wortex.live</p>
                <p className="mb-2"><strong>Support:</strong> support@wortex.live</p>
                <p className="mb-2"><strong>Website:</strong> <a href="https://wortex.live" className="text-blue-600 dark:text-blue-400 hover:underline">https://wortex.live</a></p>
              </div>
            </section>

            {/* Legal Links */}
            <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex justify-center gap-4 text-sm">
                <a
                  href="/privacy-policy"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </a>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <a
                  href="/terms-of-service"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
