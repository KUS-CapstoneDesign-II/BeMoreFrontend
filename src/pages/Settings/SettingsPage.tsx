import { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { AccountSettings } from '../../components/Settings/AccountSettings';
import { NotificationSettings } from '../../components/Settings/NotificationSettings';
import { PersonalizationSettings } from '../../components/Settings/PersonalizationSettings';
import { PrivacySettings } from '../../components/Settings/PrivacySettings';

type SettingsTab = 'account' | 'notifications' | 'personalization' | 'privacy';

export default function SettingsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  const tabs: Array<{ id: SettingsTab; label: string; icon: string }> = [
    { id: 'account', label: t('settings.tab.account') || '계정', icon: '👤' },
    { id: 'notifications', label: t('settings.tab.notifications') || '알림', icon: '🔔' },
    { id: 'personalization', label: t('settings.tab.personalization') || '개인화', icon: '🎨' },
    { id: 'privacy', label: t('settings.tab.privacy') || '프라이버시', icon: '🔒' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('settings.title') || '설정'}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('settings.subtitle') || '계정, 알림, 개인화 설정을 관리하세요'}
          </p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Settings tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="mt-8">
          {/* 계정 설정 */}
          {activeTab === 'account' && <AccountSettings />}

          {/* 알림 설정 */}
          {activeTab === 'notifications' && <NotificationSettings />}

          {/* 개인화 설정 */}
          {activeTab === 'personalization' && <PersonalizationSettings />}

          {/* 프라이버시 설정 */}
          {activeTab === 'privacy' && <PrivacySettings />}
        </div>
      </div>
    </div>
  );
}


