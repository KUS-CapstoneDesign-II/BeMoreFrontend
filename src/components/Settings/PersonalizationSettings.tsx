import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';

export function PersonalizationSettings() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const { fontScale, setFontScale, layoutDensity, setLayoutDensity, language, setLanguage } = useSettings();
  const { addToast } = useToast();

  // 테마 변경
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    addToast(t('settings.personalization.themeChanged') || '테마가 변경되었습니다', 'success');
  };

  // 폰트 크기 변경
  const handleFontScaleChange = (scale: 'sm' | 'md' | 'lg' | 'xl') => {
    setFontScale(scale);
    addToast(t('settings.personalization.fontScaleChanged') || '폰트 크기가 변경되었습니다', 'success');
  };

  // 레이아웃 밀도 변경
  const handleLayoutDensityChange = (density: 'compact' | 'spacious') => {
    setLayoutDensity(density);
    addToast(t('settings.personalization.layoutDensityChanged') || '레이아웃 밀도가 변경되었습니다', 'success');
  };

  // 언어 변경
  const handleLanguageChange = (lang: 'ko' | 'en') => {
    setLanguage(lang);
    addToast(t('settings.personalization.languageChanged') || '언어가 변경되었습니다', 'success');
  };

  // 옵션 버튼 컴포넌트
  const OptionButton = ({
    label,
    selected,
    onClick,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        selected
          ? 'bg-primary-500 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* 테마 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🎨 {t('settings.personalization.theme') || '테마'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('settings.personalization.themeDescription') || '앱의 외관을 선택하세요'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 라이트 */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              theme === 'light'
                ? 'border-primary-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
            onClick={() => handleThemeChange('light')}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">☀️</div>
              <p className="font-medium text-gray-900 dark:text-white">{t('settings.theme.light') || 'Light'}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {t('settings.theme.lightDescription') || '밝은 배경'}
              </p>
            </div>
          </div>

          {/* 다크 */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              theme === 'dark'
                ? 'border-primary-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
            onClick={() => handleThemeChange('dark')}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🌙</div>
              <p className="font-medium text-gray-900 dark:text-white">{t('settings.theme.dark') || 'Dark'}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {t('settings.theme.darkDescription') || '어두운 배경'}
              </p>
            </div>
          </div>

          {/* 시스템 */}
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              theme === 'system'
                ? 'border-primary-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
            onClick={() => handleThemeChange('system')}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">⚙️</div>
              <p className="font-medium text-gray-900 dark:text-white">{t('settings.theme.system') || 'System'}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {t('settings.theme.systemDescription') || '시스템 설정'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 폰트 크기 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🔤 {t('settings.personalization.fontSize') || '폰트 크기'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('settings.personalization.fontSizeDescription') || '텍스트의 크기를 조절하세요'}
        </p>

        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <OptionButton
              label="Aa S"
              selected={fontScale === 'sm'}
              onClick={() => handleFontScaleChange('sm')}
            />
            <OptionButton
              label="Aa M"
              selected={fontScale === 'md'}
              onClick={() => handleFontScaleChange('md')}
            />
            <OptionButton
              label="Aa L"
              selected={fontScale === 'lg'}
              onClick={() => handleFontScaleChange('lg')}
            />
            <OptionButton
              label="Aa XL"
              selected={fontScale === 'xl'}
              onClick={() => handleFontScaleChange('xl')}
            />
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <p className={`text-gray-900 dark:text-white`}>
              {t('settings.personalization.preview') || '이것은 폰트 크기 미리보기입니다'}
            </p>
          </div>
        </div>
      </div>

      {/* 레이아웃 밀도 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📐 {t('settings.personalization.layoutDensity') || '레이아웃 밀도'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('settings.personalization.layoutDensityDescription') || '화면의 간격을 조절하세요'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              layoutDensity === 'compact'
                ? 'border-primary-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
            onClick={() => handleLayoutDensityChange('compact')}
          >
            <p className="font-medium text-gray-900 dark:text-white mb-2">
              {t('settings.layout.compact') || '압축'}
            </p>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div>▔▔▔ 아이템</div>
              <div>▔▔▔ 아이템</div>
              <div>▔▔▔ 아이템</div>
            </div>
          </div>

          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              layoutDensity === 'spacious'
                ? 'border-primary-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
            onClick={() => handleLayoutDensityChange('spacious')}
          >
            <p className="font-medium text-gray-900 dark:text-white mb-2">
              {t('settings.layout.spacious') || '넓게'}
            </p>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div>▔▔▔ 아이템</div>
              <div>▔▔▔ 아이템</div>
              <div>▔▔▔ 아이템</div>
            </div>
          </div>
        </div>
      </div>

      {/* 언어 설정 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🌐 {t('settings.personalization.language') || '언어'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('settings.personalization.languageDescription') || '앱의 언어를 선택하세요'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              language === 'ko'
                ? 'border-primary-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
            onClick={() => handleLanguageChange('ko')}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🇰🇷</div>
              <p className="font-medium text-gray-900 dark:text-white">
                {t('settings.language.korean') || '한국어'}
              </p>
            </div>
          </div>

          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              language === 'en'
                ? 'border-primary-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
            onClick={() => handleLanguageChange('en')}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🇺🇸</div>
              <p className="font-medium text-gray-900 dark:text-white">
                {t('settings.language.english') || 'English'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            {t('settings.language.note') || '※ 언어 변경 후 페이지를 새로고침하면 적용됩니다'}
          </p>
        </div>
      </div>

      {/* 색상 스킴 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🎭 {t('settings.personalization.colorScheme') || '색상 스킴'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('settings.personalization.colorSchemeDescription') || '앱의 주요 색상을 선택하세요'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'Blue', color: 'bg-blue-500', hex: '#3B82F6' },
            { name: 'Purple', color: 'bg-purple-500', hex: '#A855F7' },
            { name: 'Green', color: 'bg-green-500', hex: '#10B981' },
            { name: 'Pink', color: 'bg-pink-500', hex: '#EC4899' },
          ].map((scheme) => (
            <button
              key={scheme.name}
              className={`rounded-lg p-4 text-center transition-transform hover:scale-105 border-2 border-gray-200 dark:border-gray-700`}
            >
              <div className={`${scheme.color} w-12 h-12 rounded-lg mx-auto mb-2`} />
              <p className="text-sm font-medium text-gray-900 dark:text-white">{scheme.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{scheme.hex}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            {t('settings.colorScheme.note') || '※ 색상 선택 기능은 곧 제공될 예정입니다'}
          </p>
        </div>
      </div>
    </div>
  );
}
