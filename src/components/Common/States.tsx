import { getMessageStyle, ERROR_MESSAGES, ACTION_TEXTS } from '../../utils/messageHelper';

export function LoadingState({ text = '로딩 중...' }: { text?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-4 animate-pulse">
      <p className="text-sm text-gray-600 dark:text-gray-300">{text}</p>
    </div>
  );
}

export function EmptyState({ title = '데이터 없음', desc }: { title?: string; desc?: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</div>
      {desc && <div className="text-xs text-gray-500 mt-1">{desc}</div>}
    </div>
  );
}

export function ErrorState({ message = ERROR_MESSAGES.GENERIC_ERROR, requestId, onRetry }: { message?: string; requestId?: string; onRetry?: () => void }) {
  const style = getMessageStyle('error');

  return (
    <div className={`${style.bgClass} border ${style.borderClass} rounded-lg p-4`}>
      <div className={`text-sm font-medium ${style.textClass}`}>
        {style.icon} {message}
      </div>
      {requestId && <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">요청 ID: {requestId}</div>}
      {onRetry && (
        <button onClick={onRetry} className="mt-3 px-4 py-2 min-h-[44px] text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors font-medium">
          {ACTION_TEXTS.RETRY}
        </button>
      )}
    </div>
  );
}


