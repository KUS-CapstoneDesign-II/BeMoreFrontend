import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          BeMore
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          감정 분석 기반 상담 세션 관리 플랫폼
        </p>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
          실시간 감정 인식, VAD 메트릭 분석, STT 기반 대화 내용 기록을 통해
          상담 세션의 품질을 높이고 효과적인 상담 관리를 지원합니다.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isAuthenticated ? (
            <Link
              to="/app"
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
            >
              대시보드로 이동
            </Link>
          ) : (
            <>
              <Link
                to="/auth/signup"
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
              >
                시작하기
              </Link>
              <Link
                to="/auth/login"
                className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold rounded-lg shadow-md border-2 border-blue-600 dark:border-blue-400 transition duration-300"
              >
                로그인
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          주요 기능
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-blue-600 dark:text-blue-400 mb-4">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              실시간 감정 인식
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              MediaPipe Face Mesh를 활용한 실시간 표정 분석으로 8가지 감정을 정확하게 감지합니다.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-blue-600 dark:text-blue-400 mb-4">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              VAD 메트릭 분석
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              발화/침묵 비율, 감정 분포 등 세션의 VAD(Valence-Arousal-Dominance) 메트릭을 시각화합니다.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-blue-600 dark:text-blue-400 mb-4">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              세션 리포트
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              STT 기반 대화 내용 기록과 함께 PDF/CSV 형식의 상세한 세션 리포트를 제공합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          기술 스택
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-gray-700 dark:text-gray-300 font-semibold">React 19</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">UI Framework</div>
          </div>
          <div>
            <div className="text-gray-700 dark:text-gray-300 font-semibold">TypeScript 5</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Type Safety</div>
          </div>
          <div>
            <div className="text-gray-700 dark:text-gray-300 font-semibold">MediaPipe</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Face Mesh</div>
          </div>
          <div>
            <div className="text-gray-700 dark:text-gray-300 font-semibold">Tailwind CSS</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Styling</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 dark:border-gray-700">
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
          &copy; 2025 BeMore. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
