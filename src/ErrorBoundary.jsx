import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

export default function ErrorBoundary({ children, resetKeys = undefined }) {
  const fallbackRender = React.useCallback(function FallbackComponent({ error }) {
    return (
      <div>
        Rendering error caught!
        <pre>{error.message}</pre>
        <pre>{error.stack}</pre>
      </div>
    );
  }, []);
  return (
    <ReactErrorBoundary fallbackRender={fallbackRender} resetKeys={resetKeys}>
      {children}
    </ReactErrorBoundary>
  );
}
