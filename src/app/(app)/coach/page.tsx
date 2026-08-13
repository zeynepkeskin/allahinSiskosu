import { CoachChat } from "@/components/coach-chat";
import { createClient } from "@/lib/supabase/server";

export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const displayName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.split(" ")[0]
      : undefined;

  return <CoachChat displayName={displayName} />;
}
