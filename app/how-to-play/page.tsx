import AppLayout from '@/components/layout/AppLayout';

export default function HowToPlayPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            How to Play
          </h1>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Objective
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Complete both phrases by dragging words from the spinning vortex to the assembly areas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                How to Play
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                <li>Words appear in the central vortex and rotate around</li>
                <li>Drag words to the top area (Famous Quote - Manual Assembly) and arrange them in order</li>
                <li>Drag words to the bottom area (Spoof - Auto Assembly) where they snap into place automatically</li>
                <li>Drag words to the right edge to dismiss them temporarily</li>
                <li>Complete both phrases to win and answer the bonus question</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Scoring
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your score is based on efficiency (total words seen / unique words needed). Lower scores are better. Answer the bonus question correctly for a 10% score reduction!
              </p>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
