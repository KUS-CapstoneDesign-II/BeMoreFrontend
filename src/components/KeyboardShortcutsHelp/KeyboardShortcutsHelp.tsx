import type { KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';
import { formatShortcut } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * KeyboardShortcutsHelp 컴포넌트
 *
 * 사용 가능한 키보드 단축키를 보여주는 모달입니다.
 */
export function KeyboardShortcutsHelp({ shortcuts, isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-labelledby="shortcuts-title"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2
            id="shortcuts-title"
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            ⌨️ 키보드 단축키
          </h2>
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg
              bg-gray-100 hover:bg-gray-200
              dark:bg-gray-700 dark:hover:bg-gray-600
              text-gray-700 dark:text-gray-200
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-400
            "
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 단축키 목록 */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="
                flex items-center justify-between p-3 rounded-lg
                bg-gray-50 dark:bg-gray-700/50
                hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors duration-200
              "
            >
              <span className="text-sm text-gray-700 dark:text-gray-200">
                {shortcut.description}
              </span>
              <kbd
                className="
                  px-3 py-1.5 text-sm font-mono font-semibold
                  bg-white dark:bg-gray-800
                  border border-gray-300 dark:border-gray-600
                  rounded shadow-sm
                  text-gray-800 dark:text-gray-200
                "
              >
                {formatShortcut(shortcut)}
              </kbd>
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 rounded">?</kbd>
            {' '}키를 눌러 언제든지 이 도움말을 열 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
