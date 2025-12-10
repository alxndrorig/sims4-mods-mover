import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('UI error boundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ color: '#f87171' }}>
          <h3>Произошла ошибка UI</h3>
          <div>{this.state.message}</div>
          <div style={{ color: '#94a3b8', marginTop: 8 }}>Перезапустите приложение или обновите окно.</div>
        </div>
      );
    }
    return this.props.children;
  }
}
