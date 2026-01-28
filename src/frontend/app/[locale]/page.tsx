'use client';

import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Home() {
  const t = useTranslations();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">MemoLib</h1>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('dashboard.welcome')}
          </h2>
          <p className="text-gray-600 mb-8">
            {t('common.language')}: <span className="font-semibold">{t('navigation.home')}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                {t('dashboard.documents_count')}
              </h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                {t('dashboard.tasks_count')}
              </h3>
              <p className="text-3xl font-bold text-green-600">0</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                {t('dashboard.users_count')}
              </h3>
              <p className="text-3xl font-bold text-purple-600">0</p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <h4 className="text-lg font-semibold text-yellow-900 mb-2">
              ✅ Phase 9: Internationalization Active
            </h4>
            <ul className="text-yellow-800 space-y-1 text-sm">
              <li>✓ 10 languages supported (EN, FR, ES, DE, PT, JA, ZH, HI, RU, KO)</li>
              <li>✓ Language switcher working</li>
              <li>✓ Locale detection enabled</li>
              <li>✓ Ready for global expansion</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
