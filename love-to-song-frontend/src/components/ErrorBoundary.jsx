import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    console.error('React Error Boundary caught error:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React component error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
    
    // Log the error but don't try to override location.reload
    console.warn('[ERROR_BOUNDARY] Component error caught, displaying fallback UI');
  }

  render() {
    if (this.state.hasError) {
      // Rendering fallback UI
      return (
        <div style={{
          padding: '20px',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          margin: '20px 0'
        }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#ef4444' }}>🚨 組件錯誤</h2>
          <p>此組件發生錯誤，但系統已防止頁面重新載入。</p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: 'rgba(0,0,0,0.5)', 
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}>
              <strong>錯誤詳情:</strong>
              <pre style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>
                {this.state.error.toString()}
              </pre>
              {this.state.errorInfo && (
                <pre style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
          
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
            }}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            重試
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;