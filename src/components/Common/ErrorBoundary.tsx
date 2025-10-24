import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { captureError } from '../../utils/sentry';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    try { captureError({ error, errorInfo }); } catch (e) {
      // ignore
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-[92%] sm:w-full bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 text-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">문제가 발생했습니다</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{this.state.message}</p>
            <button onClick={this.handleReload} className="mt-4 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white">새로고침</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
