export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DOCKER_BUILD) {
    const { startSyncScheduler } = await import("@/lib/sync/scheduler");
    await startSyncScheduler();
  }
}
