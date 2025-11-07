import React, { type ReactNode } from 'react';

interface ErrorBoundaryProps {
    fallback: ReactNode;
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    props: ErrorBoundaryProps;
    state: ErrorBoundaryState = { hasError: false }

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.props = props;
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true }
    }
    
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.log(error, info);
    }

    render() {
        if(this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

export default ErrorBoundary;