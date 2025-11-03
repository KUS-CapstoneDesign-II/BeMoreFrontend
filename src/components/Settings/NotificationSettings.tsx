import { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useToast } from '../../contexts/ToastContext';

interface NotificationPreferences {
  push: {
    sessionStart: boolean;
    sessionEnd: boolean;
    aiInsights: boolean;
    emergency: boolean;
  };
  email: {
    weeklyReport: boolean;
    monthlyReport: boolean;
    marketingEmails: boolean;
  };
  sms: {
    sessionReminder: boolean;
    emergency: boolean;
  };
}

export function NotificationSettings() {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push: {
      sessionStart: true,
      sessionEnd: true,
      aiInsights: true,
      emergency: true,
    },
    email: {
      weeklyReport: true,
      monthlyReport: true,
      marketingEmails: false,
    },
    sms: {
      sessionReminder: false,
      emergency: true,
    },
  });

  // 초기 로드
  useEffect(() => {
    // TODO: API에서 사용자 알림 설정 로드
    console.log('Loading notification preferences');
  }, []);

  // 토글 변경
  const handleToggle = (path: string) => {
    setPreferences((prev) => {
      const keys = path.split('.');
      const newPrefs = JSON.parse(JSON.stringify(prev));
      let current = newPrefs;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = !current[keys[keys.length - 1]];
      return newPrefs;
    });
  };

  // 저장
  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: API에 알림 설정 저장
      console.log('Saving notification preferences:', preferences);
      addToast(t('common.saved') || '저장되었습니다', 'success');
    } catch {
      addToast(t('common.saveFailed') || '저장 실패', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 모두 허용
  const handleEnableAll = () => {
    setPreferences({
      push: {
        sessionStart: true,
        sessionEnd: true,
        aiInsights: true,
        emergency: true,
      },
      email: {
        weeklyReport: true,
        monthlyReport: true,
        marketingEmails: true,
      },
      sms: {
        sessionReminder: true,
        emergency: true,
      },
    });
  };

  // 모두 차단
  const handleDisableAll = () => {
    setPreferences({
      push: {
        sessionStart: false,
        sessionEnd: false,
        aiInsights: false,
        emergency: true, // 긴급은 항상 ON
      },
      email: {
        weeklyReport: false,
        monthlyReport: false,
        marketingEmails: false,
      },
      sms: {
        sessionReminder: false,
        emergency: true, // 긴급은 항상 ON
      },
    });
  };

  // 토글 버튼 컴포넌트
  const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
        checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  // 설정 항목 컴포넌트
  const NotificationItem = ({
    label,
    description,
    checked,
    onChange,
    disabled = false,
  }: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>}
      </div>
      <div className="ml-4">
        <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 푸시 알림 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🔔 {t('settings.notifications.push') || '푸시 알림'}
        </h3>

        <div className="space-y-2">
          <NotificationItem
            label={t('settings.notifications.sessionStart') || '세션 시작 알림'}
            description={t('settings.notifications.sessionStartDesc') || '새로운 세션을 시작할 때 알림을 받습니다'}
            checked={preferences.push.sessionStart}
            onChange={() => handleToggle('push.sessionStart')}
          />
          <NotificationItem
            label={t('settings.notifications.sessionEnd') || '세션 종료 알림'}
            description={t('settings.notifications.sessionEndDesc') || '세션이 종료될 때 알림을 받습니다'}
            checked={preferences.push.sessionEnd}
            onChange={() => handleToggle('push.sessionEnd')}
          />
          <NotificationItem
            label={t('settings.notifications.aiInsights') || 'AI 인사이트 알림'}
            description={t('settings.notifications.aiInsightsDesc') || '새로운 AI 인사이트가 생길 때 알림을 받습니다'}
            checked={preferences.push.aiInsights}
            onChange={() => handleToggle('push.aiInsights')}
          />
          <NotificationItem
            label={t('settings.notifications.emergency') || '긴급 알림'}
            description={t('settings.notifications.emergencyDesc') || '중요한 긴급 알림입니다'}
            checked={preferences.push.emergency}
            onChange={() => {}}
            disabled={true}
          />
        </div>
      </div>

      {/* 이메일 알림 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📧 {t('settings.notifications.email') || '이메일 알림'}
        </h3>

        <div className="space-y-2">
          <NotificationItem
            label={t('settings.notifications.weeklyReport') || '주간 리포트'}
            description={t('settings.notifications.weeklyReportDesc') || '매주 월요일에 주간 분석 리포트를 받습니다'}
            checked={preferences.email.weeklyReport}
            onChange={() => handleToggle('email.weeklyReport')}
          />
          <NotificationItem
            label={t('settings.notifications.monthlyReport') || '월간 리포트'}
            description={t('settings.notifications.monthlyReportDesc') || '매달 1일에 월간 분석 리포트를 받습니다'}
            checked={preferences.email.monthlyReport}
            onChange={() => handleToggle('email.monthlyReport')}
          />
          <NotificationItem
            label={t('settings.notifications.marketingEmails') || '마케팅 이메일'}
            description={t('settings.notifications.marketingEmailsDesc') || '새로운 기능 및 프로모션 소식을 받습니다'}
            checked={preferences.email.marketingEmails}
            onChange={() => handleToggle('email.marketingEmails')}
          />
        </div>
      </div>

      {/* SMS 알림 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📱 {t('settings.notifications.sms') || 'SMS 알림'}
        </h3>

        <div className="space-y-2">
          <NotificationItem
            label={t('settings.notifications.sessionReminder') || '세션 리마인더'}
            description={t('settings.notifications.sessionReminderDesc') || '예정된 세션 시간이 되면 SMS로 알림을 받습니다'}
            checked={preferences.sms.sessionReminder}
            onChange={() => handleToggle('sms.sessionReminder')}
          />
          <NotificationItem
            label={t('settings.notifications.emergency') || '긴급 알림'}
            description={t('settings.notifications.emergencyDesc') || '중요한 긴급 알림입니다'}
            checked={preferences.sms.emergency}
            onChange={() => {}}
            disabled={true}
          />
        </div>
      </div>

      {/* 빠른 설정 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-4">
          {t('settings.notifications.quickSettings') || '빠른 설정'}
        </h3>
        <div className="flex gap-3">
          <button
            onClick={handleEnableAll}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {t('settings.notifications.enableAll') || '모두 허용'}
          </button>
          <button
            onClick={handleDisableAll}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            {t('settings.notifications.disableAll') || '모두 차단'}
          </button>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? t('common.saving') || '저장 중...' : t('common.save') || '저장'}
        </button>
      </div>
    </div>
  );
}
