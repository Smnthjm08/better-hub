import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserSettings } from "@/lib/user-settings-store";
import { SettingsContent } from "@/components/settings/settings-content";

export default async function SettingsPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user) return null;

  const settings = getUserSettings(session.user.id);
  const accounts = await auth.api.listUserAccounts({ headers: reqHeaders });

  return (
    <SettingsContent
      initialSettings={settings}
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      connectedAccounts={(accounts as any[]).map((a: any) => ({
        providerId: a.providerId,
      }))}
    />
  );
}
