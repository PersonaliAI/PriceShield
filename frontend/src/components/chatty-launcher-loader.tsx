"use client";

import dynamic from "next/dynamic";

// ChattyWidget's bundled dependencies (emoji-picker-react, livekit-client)
// touch browser globals (document/navigator) at module-evaluation time, not
// just inside guarded function bodies — fine in a real browser, but Next.js
// still server-renders "use client" components for their initial HTML
// unless explicitly opted out, and Node has neither global during that
// prerender pass. ssr:false skips that entirely, matching how the old
// widget.js embed worked too (client-only, loaded well after hydration).
const ChattyLauncher = dynamic(() => import("./chatty-launcher"), { ssr: false });

export default ChattyLauncher;
