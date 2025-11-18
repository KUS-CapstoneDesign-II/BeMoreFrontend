import React from 'react';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onComplete?: (task: Task) => void;
}

// Difficulty styles
const difficultyStyles = {
  easy: {
    badge: 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100',
    icon: '✓',
  },
  medium: {
    badge: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100',
    icon: '◐',
  },
  hard: {
    badge: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100',
    icon: '★',
  },
};

const difficultyLabels = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete }) => {
  const style = difficultyStyles[task.difficulty as keyof typeof difficultyStyles];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow">
      {/* Title */}
      <h6 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {task.title}
      </h6>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        {task.description}
      </p>

      {/* Metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Difficulty Badge */}
          <span className={`text-xs font-medium px-2 py-1 rounded ${style.badge}`}>
            {style.icon} {difficultyLabels[task.difficulty as keyof typeof difficultyLabels]}
          </span>

          {/* Duration */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {task.duration}
          </span>
        </div>

        {/* Action Button */}
        {onComplete && (
          <button
            onClick={() => onComplete(task)}
            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            시작하기 →
          </button>
        )}
      </div>
    </div>
  );
};
