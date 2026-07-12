import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ color: '#d32f2f' }}>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Error Details</summary>
            <br />
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo?.componentStack}
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
