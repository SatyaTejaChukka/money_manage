import React from 'react';
import { Button } from './ui/Button'; // Assuming you have a Button component, otherwise use standard button

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // You can also log the error to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
          <h1 className="text-4xl font-bold mb-4">Oops!</h1>
          <p className="text-xl mb-6 text-muted-foreground">Something went wrong.</p>
          <div className="p-4 bg-muted/30 rounded-lg mb-6 max-w-md overflow-auto text-left text-sm font-mono">
             {this.state.error?.message || "Unknown error"}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
