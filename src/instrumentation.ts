export async function register() {
  // Start BullMQ worker only on server side (not edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAutoSubmitWorker } = await import(
      "@/lib/queue/exam-submit.queue"
    );
    startAutoSubmitWorker();
  }
}
