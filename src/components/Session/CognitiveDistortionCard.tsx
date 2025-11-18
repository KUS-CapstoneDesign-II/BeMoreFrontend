import React from 'react';
import { CognitiveDistortion } from '../../types';

interface CognitiveDistortionCardProps {
  distortion: CognitiveDistortion;
}

// Severity color mapping
const severityStyles = {
  low: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-700',
    text: 'text-yellow-800 dark:text-yellow-200',
    badge: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100',
  },
  medium: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-700',
    text: 'text-orange-800 dark:text-orange-200',
    badge: 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100',
  },
  high: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700',
    text: 'text-red-800 dark:text-red-200',
    badge: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100',
  },
};

// Severity Korean labels
const severityLabels = {
  low: '낮음',
  medium: '중간',
  high: '높음',
};

export const CognitiveDistortionCard: React.FC<CognitiveDistortionCardProps> = ({ distortion }) => {
  const style = severityStyles[distortion.severity];

  return (
    <div className={`border rounded-lg p-4 ${style.bg} ${style.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className={`font-semibold ${style.text}`}>
            {distortion.name_ko}
          </h5>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
            {distortion.type}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity Badge */}
          <span className={`text-xs font-medium px-2 py-1 rounded ${style.badge}`}>
            {severityLabels[distortion.severity]}
          </span>

          {/* Confidence Score */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(distortion.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Examples */}
      {distortion.examples && distortion.examples.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            발견된 표현:
          </div>
          <ul className="space-y-1">
            {distortion.examples.map((example, index) => (
              <li
                key={index}
                className="text-sm text-gray-800 dark:text-gray-200 bg-white/50 dark:bg-gray-800/50 rounded px-2 py-1"
              >
                "{example}"
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence Indicator */}
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">신뢰도</div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${style.badge}`}
              style={{ width: `${distortion.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
