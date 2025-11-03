import { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useToast } from '../../contexts/ToastContext';

interface PrivacyPreferences {
  analyticsConsent: boolean;
  marketingConsent: boolean;
  thirdPartySharing: boolean;
}

export function PrivacySettings() {
  const { t } = useI18n();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    analyticsConsent: true,
    marketingConsent: false,
    thirdPartySharing: false,
  });

  // 토글 변경
  const handleToggle = (key: keyof PrivacyPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 저장
  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: API에 프라이버시 설정 저장
      console.log('Saving privacy preferences:', preferences);
      addToast(t('common.saved') || '저장되었습니다', 'success');
    } catch {
      addToast(t('common.saveFailed') || '저장 실패', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 데이터 내보내기
  const handleExportData = async () => {
    try {
      // TODO: API 호출 - 전체 데이터 내보내기
      console.log('Exporting user data');
      addToast(t('settings.privacy.exportStarted') || '데이터 내보내기가 시작되었습니다', 'success');
    } catch {
      addToast(t('settings.privacy.exportFailed') || '데이터 내보내기 실패', 'error');
    }
  };

  // 데이터 삭제
  const handleDeleteData = async (type: string) => {
    if (!window.confirm(t('settings.privacy.deleteConfirm') || '정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      // TODO: API 호출 - 특정 데이터 삭제
      console.log('Deleting data:', type);
      addToast(t('settings.privacy.dataDeleted') || '데이터가 삭제되었습니다', 'success');
    } catch {
      addToast(t('settings.privacy.deleteFailed') || '데이터 삭제 실패', 'error');
    }
  };

  // 토글 버튼 컴포넌트
  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
        checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
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

  return (
    <div className="space-y-6">
      {/* 데이터 수집 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 {t('settings.privacy.dataCollection') || '데이터 수집'}
        </h3>

        <div className="space-y-4">
          {/* 분석 데이터 */}
          <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {t('settings.privacy.analytics') || '분석 데이터 수집'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('settings.privacy.analyticsDescription') ||
                  '앱 사용 패턴을 분석하여 서비스를 개선하는 데 사용됩니다'}
              </p>
            </div>
            <div className="ml-4">
              <ToggleSwitch
                checked={preferences.analyticsConsent}
                onChange={() => handleToggle('analyticsConsent')}
              />
            </div>
          </div>

          {/* 마케팅 동의 */}
          <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {t('settings.privacy.marketing') || '마케팅 목적의 데이터 사용'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('settings.privacy.marketingDescription') ||
                  '개인화된 추천과 마케팅 캠페인을 위해 데이터를 사용할 수 있습니다'}
              </p>
            </div>
            <div className="ml-4">
              <ToggleSwitch
                checked={preferences.marketingConsent}
                onChange={() => handleToggle('marketingConsent')}
              />
            </div>
          </div>

          {/* 제3자 공유 */}
          <div className="flex items-start justify-between py-4">
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {t('settings.privacy.thirdParty') || '제3자와의 데이터 공유'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('settings.privacy.thirdPartyDescription') ||
                  '우리는 귀하의 명시적인 동의 없이 제3자와 개인 데이터를 공유하지 않습니다'}
              </p>
            </div>
            <div className="ml-4">
              <ToggleSwitch
                checked={preferences.thirdPartySharing}
                onChange={() => handleToggle('thirdPartySharing')}
                />
            </div>
          </div>
        </div>
      </div>

      {/* 데이터 관리 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          💾 {t('settings.privacy.dataManagement') || '데이터 관리'}
        </h3>

        <div className="space-y-4">
          {/* 데이터 다운로드 */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              {t('settings.privacy.downloadData') || '데이터 다운로드'}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('settings.privacy.downloadDescription') ||
                '모든 개인 데이터를 JSON 형식으로 다운로드할 수 있습니다'}
            </p>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              📥 {t('settings.privacy.downloadAll') || '전체 데이터 다운로드'}
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              {t('settings.privacy.selectiveDownload') || '선택적 다운로드'}
            </h4>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                📋 {t('settings.privacy.sessionHistory') || '세션 히스토리'} (.json)
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                💬 {t('settings.privacy.messageHistory') || '메시지 히스토리'} (.json)
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                📊 {t('settings.privacy.emotionAnalysis') || '감정 분석 데이터'} (.csv)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 데이터 삭제 */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-4">
          🗑️ {t('settings.privacy.dangerZone') || '위험 영역 - 데이터 삭제'}
        </h3>

        <p className="text-sm text-red-800 dark:text-red-300 mb-4">
          {t('settings.privacy.deleteWarning') ||
            '주의: 삭제된 데이터는 복구할 수 없습니다. 신중하게 선택하세요.'}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleDeleteData('sessions')}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-left"
          >
            🗑️ {t('settings.privacy.deleteSessionHistory') || '세션 히스토리 삭제'}
          </button>
          <button
            onClick={() => handleDeleteData('messages')}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-left"
          >
            🗑️ {t('settings.privacy.deleteMessageHistory') || '메시지 히스토리 삭제'}
          </button>
          <button
            onClick={() => handleDeleteData('all')}
            className="w-full px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-medium transition-colors text-left"
          >
            ⚠️ {t('settings.privacy.deleteAllData') || '모든 데이터 삭제 (되돌릴 수 없음)'}
          </button>
        </div>
      </div>

      {/* 개인정보 처리방침 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
          📄 {t('settings.privacy.privacyPolicy') || '개인정보 처리방침'}
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
          {t('settings.privacy.policyDescription') ||
            '어떻게 데이터를 수집, 사용, 보호하는지에 대해 자세히 알아보세요'}
        </p>
        <a
          href="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {t('settings.privacy.viewPolicy') || '전체 정책 보기 →'}
        </a>
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
