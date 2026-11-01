import { Component } from "react";
import Button from "@/components/ui/Button";

/**
 * Catches render errors so a single bad widget does not blank the whole app.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error, info?.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ error: null });
    if (typeof this.props.onReset === "function") this.props.onReset();
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="grid min-h-[40vh] place-items-center px-6 py-16 text-center" role="alert">
          <div className="max-w-md">
            <h2 className="text-lg font-semibold tracking-tight">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred while rendering this page."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button type="button" variant="secondary" onClick={this.handleRetry}>
                Try again
              </Button>
              <Button type="button" variant="secondary" onClick={() => window.location.assign("/")}>
                Go home
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
