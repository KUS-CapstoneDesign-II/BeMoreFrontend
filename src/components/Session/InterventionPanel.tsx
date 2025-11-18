import React, { useState } from 'react';
import type { Intervention } from '../../types';
import { TaskCard } from './TaskCard';

interface InterventionPanelProps {
  intervention: Intervention;
}

// Urgency styles
const urgencyStyles = {
  immediate: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    badge: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100',
    icon: '🚨',
  },
  soon: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-300 dark:border-orange-700',
    badge: 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100',
    icon: '⚠️',
  },
  routine: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    badge: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100',
    icon: 'ℹ️',
  },
};

const urgencyLabels = {
  immediate: '즉시 권장',
  soon: '빠른 시일 내 권장',
  routine: '일상적 관리',
};

export const InterventionPanel: React.FC<InterventionPanelProps> = ({ intervention }) => {
  const [answersExpanded, setAnswersExpanded] = useState(false);
  const style = urgencyStyles[intervention.urgency as keyof typeof urgencyStyles] || urgencyStyles.routine;

  return (
    <div className={`border-2 rounded-lg p-4 ${style.bg} ${style.border}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-3xl">{style.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              CBT 개입 권장
            </h4>
            <span className={`text-xs font-medium px-2 py-1 rounded ${style.badge}`}>
              {urgencyLabels[intervention.urgency as keyof typeof urgencyLabels] || urgencyLabels.routine}
            </span>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">{intervention.distortionName}</span> 패턴이 발견되었습니다
          </div>
        </div>
      </div>

      {/* Reflection Questions */}
      {intervention.questions && intervention.questions.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setAnswersExpanded(!answersExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <span>{answersExpanded ? '▼' : '▶'}</span>
            <span>생각해볼 질문들 ({intervention.questions.length}개)</span>
          </button>

          {answersExpanded && (
            <div className="space-y-2 pl-6">
              {intervention.questions.map((question, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-primary-600 dark:text-primary-400 font-semibold">
                      Q{index + 1}.
                    </span>
                    <p className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                      {question}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommended Tasks */}
      {intervention.tasks && intervention.tasks.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            권장 활동 ({intervention.tasks.length}개)
          </h5>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {intervention.tasks.map((task, index) => (
              <TaskCard key={index} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
