// Message Batches API illustration (Domain 4 mandate).
//
// USE FOR: scheduled reports, weekly audits, nightly test generation —
//          anything latency-tolerant. 50% cost savings, up to 24h to process.
//
// DO NOT USE FOR: PR pre-merge checks, tool-calling loops. The Batches API is
//                 fire-and-forget — there is no mid-request callback to return
//                 tool results to the model.

export interface BatchJob {
  id: string;
  prompt: string;
  createdAt: number;
  status: 'pending' | 'completed' | 'failed';
  result?: string;
}

export class BatchQueue {
  private jobs: BatchJob[] = [];

  enqueue(prompt: string): BatchJob {
    const job: BatchJob = {
      id: `batch_${Math.random().toString(36).slice(2, 10)}`,
      prompt,
      createdAt: Date.now(),
      status: 'pending',
    };
    this.jobs.push(job);
    return job;
  }

  list(): BatchJob[] {
    return [...this.jobs];
  }

  // Real impl would poll Anthropic's batches endpoint. This mock just marks
  // jobs completed after a short delay so the showcase can render the flow.
  async pollAll(): Promise<void> {
    await new Promise((r) => setTimeout(r, 300));
    for (const job of this.jobs) {
      if (job.status === 'pending') {
        job.status = 'completed';
        job.result = `[mock-batch-result for: "${job.prompt.slice(0, 60)}…"]`;
      }
    }
  }
}
