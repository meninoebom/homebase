// Last-resort catch for render-time exceptions.
//
// The data layer is careful about failed reads (see the accessError /
// draftsError / configError states in store/ritual.ts), but nothing caught an
// exception thrown during render, so any such bug showed the user a blank
// white page. For an app people write into daily, a blank page reads as "my
// journal is gone" — hence the reassurance below, which is the important part
// of this component and is simply true: Homebase only ever appends to files
// the user owns, and a crash here happened after the writing was on disk.
//
// Deliberately a class: React exposes error catching only through
// componentDidCatch / getDerivedStateFromError, which have no hook equivalent.

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No telemetry in Homebase by design, so the console is the only place
    // this can go. It's what a user will be asked to paste into a bug report.
    console.error("Homebase crashed while rendering", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="font-serif text-2xl text-[#374151]">Homebase hit a bug.</h1>
        <p className="font-serif text-[15px] leading-relaxed text-[#6B7280]">
          Your writing is safe. Everything you have written is a plain markdown file in your own
          folder, and this failure happened in the app, not on disk. Open the folder in any text
          editor and it is all there.
        </p>
        <p className="font-serif text-[15px] leading-relaxed text-[#6B7280]">
          Reloading usually clears it. If it keeps happening, the details below are worth sending
          along with a bug report.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded bg-[#374151] px-4 py-2 font-sans text-[13px] text-white hover:bg-[#1F2937]"
        >
          Reload
        </button>
        <p className="font-mono text-[12px] break-words text-[#9CA3AF]">
          {this.state.error.message}
        </p>
      </div>
    );
  }
}
