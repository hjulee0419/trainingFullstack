import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorMessage } from '@/shared/components/ErrorMessage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 'var(--space-8)' }}>
          <ErrorMessage message="예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." />
        </div>
      );
    }

    return this.props.children;
  }
}
