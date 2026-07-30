import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { useLocaleStore } from '@/features/locale/useLocaleStore';
import { translate } from '@/lib/i18n/useTranslation';

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
          <ErrorMessage
            message={translate(useLocaleStore.getState().locale, 'common.unexpectedError')}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
