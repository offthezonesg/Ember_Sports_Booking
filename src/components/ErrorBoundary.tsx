import React from 'react';
import i18n from '../i18n';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{i18n.t('errorBoundary.title')}</h1>
            <p className="text-gray-600 mb-6">{i18n.t('errorBoundary.message')}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              {i18n.t('errorBoundary.refresh')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
