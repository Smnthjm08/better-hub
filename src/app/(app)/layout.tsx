import { Suspense } from "react";
import { headers } from "next/headers";
import { AppNavbar } from "@/components/layout/navbar";
import { AppFooterNav } from "@/components/layout/footer-nav";
import { GlobalChatProvider } from "@/components/shared/global-chat-provider";
import { GlobalChatPanel } from "@/components/shared/global-chat-panel";
import { FloatingGhostButton } from "@/components/shared/floating-ghost-button";
import { auth } from "@/lib/auth";
import { getGhostTabState, type GhostTabState } from "@/lib/chat-store";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let initialTabState: GhostTabState = {
    tabs: [{ id: "default", label: "Thread 1" }],
    activeTabId: "default",
    counter: 1,
  };

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      initialTabState = getGhostTabState(session.user.id);
    }
  } catch {}

  return (
    <GlobalChatProvider initialTabState={initialTabState}>
      <div className="flex flex-col h-dvh overflow-y-auto lg:overflow-hidden">
        <AppNavbar />
        <div className="mt-10 lg:h-[calc(100dvh-var(--spacing)*10)] flex flex-col px-4 pt-4 lg:overflow-auto">
          {children}
        </div>
        <AppFooterNav />
        <FloatingGhostButton />
        <Suspense>
          <GlobalChatPanel />
        </Suspense>
      </div>
    </GlobalChatProvider>
  );
}
