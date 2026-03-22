import cron, { type ScheduledTask } from "node-cron";
import { prisma } from "@/lib/db";
import { syncAllProviders } from "./sync-engine";

let scheduledTask: ScheduledTask | null = null;

export function startSyncScheduler() {
  if (scheduledTask) return;

  // Run every 6 hours
  scheduledTask = cron.schedule("0 */6 * * *", async () => {
    console.log("[Sync Scheduler] Starting scheduled sync...");
    try {
      const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });

      for (const org of orgs) {
        console.log(`[Sync Scheduler] Syncing org: ${org.name}`);
        try {
          const results = await syncAllProviders(org.id);
          console.log(`[Sync Scheduler] Org ${org.name} sync results:`, results);
        } catch (error) {
          console.error(`[Sync Scheduler] Error syncing org ${org.name}:`, error);
        }
      }
    } catch (error) {
      console.error("[Sync Scheduler] Fatal error:", error);
    }
  });

  console.log("[Sync Scheduler] Scheduled sync every 6 hours");
}

export function stopSyncScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
}
