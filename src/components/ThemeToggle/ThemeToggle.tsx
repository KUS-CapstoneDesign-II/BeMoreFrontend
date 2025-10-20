import { useTheme } from '../../contexts/ThemeContext';

/**
 * ThemeToggle 컴포넌트
 *
 * 라이트/다크/시스템 테마를 순환하는 토글 버튼입니다.
 */
export function ThemeToggle() {
  const { theme, effectiveTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    if (theme === 'system') {
      return effectiveTheme === 'dark' ? '🌙' : '☀️';
    }
    return theme === 'dark' ? '🌙' : '☀️';
  };

  const getLabel = () => {
    if (theme === 'system') {
      return `시스템 (${effectiveTheme === 'dark' ? '다크' : '라이트'})`;
    }
    return theme === 'dark' ? '다크 모드' : '라이트 모드';
  };

  return (
    <button
      onClick={toggleTheme}
      className="
        p-2 rounded-lg
        bg-gray-100 hover:bg-gray-200
        dark:bg-gray-800 dark:hover:bg-gray-700
        text-gray-700 dark:text-gray-200
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
      "
      aria-label={`테마 전환 (현재: ${getLabel()})`}
      title={getLabel()}
    >
      <span className="text-xl" aria-hidden="true">{getIcon()}</span>
    </button>
  );
}
