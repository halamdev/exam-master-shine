// Simulated Redis Message Queue
// Models: LPUSH/BRPOP, visibility timeout, dead letter queue

export class MessageQueue {
  private queues: Map<string, string[]> = new Map();

  constructor(queueNames: string[]) {
    for (const name of queueNames) {
      this.queues.set(name, []);
    }
  }

  /** LPUSH - add item to queue */
  push(queueName: string, itemId: string) {
    const queue = this.queues.get(queueName);
    if (queue) queue.push(itemId);
  }

  /** BRPOP - pop item from queue (returns undefined if empty) */
  pop(queueName: string): string | undefined {
    const queue = this.queues.get(queueName);
    return queue?.shift();
  }

  /** Get queue length */
  length(queueName: string): number {
    return this.queues.get(queueName)?.length || 0;
  }

  /** Get all queue stats */
  getStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [name, queue] of this.queues.entries()) {
      stats[name] = queue.length;
    }
    return stats;
  }

  /** Clear all queues */
  clear() {
    for (const queue of this.queues.values()) {
      queue.length = 0;
    }
  }
}
