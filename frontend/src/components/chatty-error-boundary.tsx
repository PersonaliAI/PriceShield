"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// The SDK bundles livekit-client/emoji-picker-react; a runtime failure inside
// either (or any other uncaught error in ChattyWidget) would otherwise bubble
// up to Next.js's global error boundary and take down the whole page. This
// isolates that blast radius to "no widget" instead.
export default class ChattyErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Chatty widget crashed:", error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
