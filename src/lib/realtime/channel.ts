import { supabase } from "@/integrations/supabase/client";

/**
 * Returns a fresh realtime channel for `topic`, first removing any stale
 * channel left over from a previous mount.
 *
 * supabase.channel(topic) reuses an existing channel with the same topic, and
 * because removeChannel() is asynchronous a remount (e.g. navigating away and
 * back) can hand back an already-subscribed channel. Calling .on() on that
 * channel throws "cannot add postgres_changes callbacks after subscribe()"
 * which, when thrown inside a useEffect, crashes the whole page.
 */
export function freshChannel(topic: string) {
  for (const existing of supabase.getChannels()) {
    if (existing.topic === `realtime:${topic}`) {
      supabase.removeChannel(existing);
    }
  }
  return supabase.channel(topic);
}
