import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import RefreshCcw from 'lucide-react/dist/esm/icons/refresh-ccw';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TabErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in tab:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white/40 dark:bg-black/20 backdrop-blur-md border border-dashed border-muted rounded-3xl min-h-[400px]">
          <div className="bg-destructive/10 p-4 rounded-full mb-6 text-destructive">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold mb-2">탭을 불러오는 중 문제가 발생했습니다</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            일시적인 오류이거나 시스템에 문제가 있을 수 있습니다. <br />
            아래 버튼을 눌러 다시 시도해 보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="default" 
              className="px-8 bg-primary hover:bg-primary/90"
              onClick={this.handleReset}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => window.location.reload()}
            >
              페이지 새로고침
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-black/5 dark:bg-white/5 rounded-lg text-left text-xs font-mono max-w-full overflow-auto">
              {this.state.error?.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
