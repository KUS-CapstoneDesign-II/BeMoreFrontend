import React from 'react';
import type { CBTAnalysis } from '../../types';
import { CognitiveDistortionCard } from './CognitiveDistortionCard';
import { InterventionPanel } from './InterventionPanel';

interface CBTAnalysisSectionProps {
  cbtFindings: CBTAnalysis[];
}

export const CBTAnalysisSection: React.FC<CBTAnalysisSectionProps> = ({ cbtFindings }) => {
  // Calculate summary statistics
  const totalFindings = cbtFindings.length;
  const findingsWithDistortions = cbtFindings.filter(f => f.hasDistortions);
  const findingsNeedingIntervention = cbtFindings.filter(f => f.needsIntervention);

  // Extract all distortions from all findings
  const allDistortions = cbtFindings.flatMap(f => f.detections || []);

  // Count distortion types
  const distortionCounts = allDistortions.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find most common distortion
  const mostCommonType = Object.entries(distortionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  const mostCommonDistortion = allDistortions.find(d => d.type === mostCommonType);

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          CBT 분석 결과
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">분석 구간</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalFindings}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">왜곡 발견</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {findingsWithDistortions.length}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">개입 필요</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {findingsNeedingIntervention.length}
            </div>
          </div>
        </div>

        {mostCommonDistortion && (
          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">가장 흔한 왜곡</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {mostCommonDistortion.name_ko}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              총 {mostCommonType ? distortionCounts[mostCommonType] : 0}회 발견
            </div>
          </div>
        )}
      </div>

      {/* Cognitive Distortions List */}
      {allDistortions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
            발견된 인지 왜곡 ({allDistortions.length}건)
          </h4>
          <div className="space-y-3">
            {allDistortions.map((distortion, index) => (
              <CognitiveDistortionCard key={index} distortion={distortion} />
            ))}
          </div>
        </div>
      )}

      {/* Intervention Panels */}
      {cbtFindings.map((finding, index) => (
        finding.intervention && (
          <InterventionPanel
            key={index}
            intervention={finding.intervention}
          />
        )
      ))}

      {/* No Distortions Message */}
      {allDistortions.length === 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-medium text-green-800 dark:text-green-200">
                인지 왜곡이 발견되지 않았습니다
              </div>
              <div className="text-sm text-green-600 dark:text-green-300 mt-1">
                세션 동안 건강한 사고 패턴을 유지하셨습니다.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
