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

export function ErrorState({ message = '오류가 발생했습니다', requestId, onRetry }: { message?: string; requestId?: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="text-sm text-red-800 dark:text-red-200">{message}</div>
      {requestId && <div className="text-[11px] text-red-700/80 dark:text-red-300/80 mt-1">requestId: {requestId}</div>}
      {onRetry && (
        <button onClick={onRetry} className="mt-2 px-2 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700">다시 시도</button>
      )}
    </div>
  );
}


