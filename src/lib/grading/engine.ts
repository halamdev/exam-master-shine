// Main Grading Engine - Master-Slave Coordinator
// Orchestrates: Task decomposition, Queue management, Worker assignment, Result aggregation

import type {
  Task, Submission, Worker, QueueStats,
  EngineMetrics, EngineEvent, EngineEventType,
  GradingEngineConfig, ExamType, TaskType,
} from './types';
import { DEFAULT_CONFIG } from './types';
import { genId } from './utils';
import { generateSubmissions as genSubs } from './data-generator';
import { processMcqTask, processEssayTask, processFraudTask } from './workers';

export class GradingEngine {
  private config: GradingEngineConfig;
  private submissions: Map<string, Submission> = new Map();
  private tasks: Map<string, Task> = new Map();
  private workers: Map<string, Worker> = new Map();

  // Simulated Redis queues
  private mcqQueue: string[] = [];
  private essayQueue: string[] = [];
  private fraudQueue: string[] = [];
  private resultQueue: string[] = [];
  private deadLetterQueue: string[] = [];

  private listeners: ((event: EngineEvent) => void)[] = [];
  private isRunning = false;
  private processingTimers: ReturnType<typeof setTimeout>[] = [];
  private startTime = 0;
  private processedLatencies: number[] = [];
  private correctAnswers: Map<string, string[]> = new Map();

  constructor(config: Partial<GradingEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  on(listener: (event: EngineEvent) => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emit(type: EngineEventType, data: any = {}) {
    const event: EngineEvent = { type, timestamp: Date.now(), data };
    this.listeners.forEach(l => l(event));
  }

  getConfig() { return { ...this.config }; }
  updateConfig(partial: Partial<GradingEngineConfig>) {
    this.config = { ...this.config, ...partial };
  }

  getSubmissions(): Submission[] { return Array.from(this.submissions.values()); }
  getTasks(): Task[] { return Array.from(this.tasks.values()); }
  getWorkers(): Worker[] { return Array.from(this.workers.values()); }

  getQueueStats(): QueueStats {
    return {
      mcqQueue: this.mcqQueue.length,
      essayQueue: this.essayQueue.length,
      fraudQueue: this.fraudQueue.length,
      resultQueue: this.resultQueue.length,
      deadLetterQueue: this.deadLetterQueue.length,
    };
  }

  getMetrics(): EngineMetrics {
    const subs = Array.from(this.submissions.values());
    const tasks = Array.from(this.tasks.values());
    const completed = tasks.filter(t => t.status === 'completed');
    const elapsed = this.startTime ? Date.now() - this.startTime : 0;
    const completedSubs = subs.filter(s => s.status === 'COMPLETED');

    const latencies = this.processedLatencies.slice().sort((a, b) => a - b);
    const p95Idx = Math.floor(latencies.length * 0.95);

    return {
      totalSubmissions: subs.length,
      completedSubmissions: completedSubs.length,
      failedSubmissions: subs.filter(s => s.status === 'FAILED').length,
      totalTasks: tasks.length,
      completedTasks: completed.length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      retriedTasks: tasks.filter(t => t.retryCount > 0).length,
      avgProcessingTimeMs: completed.length
        ? completed.reduce((s, t) => s + (t.result?.processingTimeMs || 0), 0) / completed.length
        : 0,
      throughputPerMinute: elapsed > 0 ? (completedSubs.length / (elapsed / 60000)) : 0,
      startTime: this.startTime,
      elapsedMs: elapsed,
      p95LatencyMs: latencies[p95Idx] || 0,
    };
  }

  generateSubmissions(count: number, examType: ExamType = 'MCQ', questionsPerExam = 50): Submission[] {
    const { submissions, correctAnswers } = genSubs(count, examType, questionsPerExam);
    for (const sub of submissions) {
      this.submissions.set(sub.id, sub);
    }
    for (const [k, v] of correctAnswers) {
      this.correctAnswers.set(k, v);
    }
    return submissions;
  }

  private initWorkers() {
    this.workers.clear();
    const types: TaskType[] = ['mcq', 'essay', 'fraud'];
    for (const type of types) {
      const count = this.config.workerCount[type];
      for (let i = 0; i < count; i++) {
        const worker: Worker = {
          id: `${type}-worker-${i + 1}`,
          type,
          status: 'idle',
          tasksProcessed: 0,
          totalProcessingTime: 0,
          lastHeartbeat: Date.now(),
          isAlive: true,
        };
        this.workers.set(worker.id, worker);
        this.emit('worker_started', { workerId: worker.id, type });
      }
    }
  }

  // Master: Task Decomposer
  private decomposeSubmission(sub: Submission) {
    sub.status = 'PROCESSING';

    if (sub.type === 'MCQ' || sub.type === 'MIXED') {
      const task: Task = {
        id: genId('task'),
        submissionId: sub.id,
        type: 'mcq',
        status: 'pending',
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        createdAt: Date.now(),
        data: {
          answers: (sub.content as { answers: string[] }).answers,
          correctAnswers: this.correctAnswers.get(sub.examId),
        },
      };
      this.tasks.set(task.id, task);
      sub.taskIds.push(task.id);
      this.mcqQueue.push(task.id);
      this.emit('task_created', { taskId: task.id, type: 'mcq', submissionId: sub.id });
    }

    if (sub.type === 'ESSAY' || sub.type === 'MIXED') {
      const text = (sub.content as { text: string }).text;
      const words = text.split(' ');
      const chunkSize = this.config.chunkSize;
      const overlap = this.config.chunkOverlap;

      let i = 0;
      let chunkIdx = 0;
      while (i < words.length) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        const task: Task = {
          id: genId('task'),
          submissionId: sub.id,
          type: 'essay',
          status: 'pending',
          retryCount: 0,
          maxRetries: this.config.maxRetries,
          createdAt: Date.now(),
          data: { chunkContent: chunk, chunkIndex: chunkIdx, wordCount: chunk.split(' ').length },
        };
        this.tasks.set(task.id, task);
        sub.taskIds.push(task.id);
        this.essayQueue.push(task.id);
        this.emit('task_created', { taskId: task.id, type: 'essay', submissionId: sub.id });
        i += chunkSize - overlap;
        chunkIdx++;
      }
    }

    this.emit('submission_received', { submissionId: sub.id, taskCount: sub.taskIds.length });
  }

  // Worker: Process a task
  private processTask(worker: Worker, taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task || !worker.isAlive) return;

    task.status = 'processing';
    task.workerId = worker.id;
    task.startedAt = Date.now();
    worker.status = 'busy';
    worker.currentTaskId = taskId;

    this.emit('task_assigned', { taskId, workerId: worker.id, type: task.type });

    // Simulate fault
    if (this.config.enableFaultSimulation && Math.random() < this.config.faultProbability) {
      const timer = setTimeout(() => {
        if (!worker.isAlive) return;
        this.handleWorkerFault(worker, task);
      }, Math.random() * 500 + 100);
      this.processingTimers.push(timer);
      return;
    }

    const baseTime = task.type === 'mcq' ? this.config.mcqProcessingTimeMs
      : task.type === 'essay' ? this.config.essayProcessingTimeMs
      : this.config.fraudProcessingTimeMs;
    const jitter = baseTime * (0.5 + Math.random());

    const timer = setTimeout(() => {
      if (!worker.isAlive || !this.isRunning) return;

      const processingTime = Date.now() - (task.startedAt || Date.now());
      task.data._processingTimeMs = processingTime;

      // Use real worker logic
      if (task.type === 'mcq') {
        task.result = processMcqTask(task);
      } else if (task.type === 'essay') {
        task.result = processEssayTask(task);
      } else {
        task.result = processFraudTask(task);
      }
      task.result.workerId = worker.id;

      task.status = 'completed';
      task.completedAt = Date.now();
      worker.tasksProcessed++;
      worker.totalProcessingTime += processingTime;
      worker.status = 'idle';
      worker.currentTaskId = undefined;
      worker.lastHeartbeat = Date.now();

      this.resultQueue.push(task.id);
      this.processedLatencies.push(processingTime);
      this.emit('task_completed', { taskId: task.id, workerId: worker.id, processingTimeMs: processingTime });

      this.checkAndAggregateSubmission(task.submissionId);
      this.emit('metrics_update', this.getMetrics());
      this.assignNextTask(worker);
    }, jitter);
    this.processingTimers.push(timer);
  }

  private handleWorkerFault(worker: Worker, task: Task) {
    worker.status = 'failed';
    worker.currentTaskId = undefined;
    this.emit('worker_fault', { workerId: worker.id, taskId: task.id });

    if (task.retryCount < task.maxRetries) {
      task.retryCount++;
      task.status = 'retrying';
      task.workerId = undefined;

      const timer = setTimeout(() => {
        if (!this.isRunning) return;
        const queue = task.type === 'mcq' ? this.mcqQueue : task.type === 'essay' ? this.essayQueue : this.fraudQueue;
        queue.push(task.id);
        task.status = 'pending';
        this.emit('task_retried', { taskId: task.id, retryCount: task.retryCount });

        worker.status = 'idle';
        worker.isAlive = true;
        worker.lastHeartbeat = Date.now();
        this.assignNextTask(worker);
      }, this.config.visibilityTimeoutMs);
      this.processingTimers.push(timer);
    } else {
      task.status = 'failed';
      this.deadLetterQueue.push(task.id);
      this.emit('dead_letter', { taskId: task.id });
      worker.status = 'idle';
      worker.isAlive = true;
      this.assignNextTask(worker);
    }
  }

  killWorker(workerId: string) {
    const worker = this.workers.get(workerId);
    if (!worker) return;
    worker.isAlive = false;
    worker.status = 'stopped';
    if (worker.currentTaskId) {
      const task = this.tasks.get(worker.currentTaskId);
      if (task && task.status === 'processing') {
        this.handleWorkerFault(worker, task);
      }
    }
    this.emit('worker_stopped', { workerId });
  }

  reviveWorker(workerId: string) {
    const worker = this.workers.get(workerId);
    if (!worker) return;
    worker.isAlive = true;
    worker.status = 'idle';
    worker.lastHeartbeat = Date.now();
    this.emit('worker_started', { workerId, type: worker.type });
    this.assignNextTask(worker);
  }

  private assignNextTask(worker: Worker) {
    if (!worker.isAlive || worker.status === 'busy' || !this.isRunning) return;
    const queue = worker.type === 'mcq' ? this.mcqQueue
      : worker.type === 'essay' ? this.essayQueue
      : this.fraudQueue;
    const taskId = queue.shift();
    if (taskId) this.processTask(worker, taskId);
  }

  // Aggregator: combine results when all tasks for a submission are done
  private checkAndAggregateSubmission(submissionId: string) {
    const sub = this.submissions.get(submissionId);
    if (!sub) return;

    const tasks = sub.taskIds.map(id => this.tasks.get(id)!).filter(Boolean);
    const allDone = tasks.every(t => t.status === 'completed' || t.status === 'failed');
    if (!allDone) return;

    const mcqTasks = tasks.filter(t => t.type === 'mcq' && t.result);
    const essayTasks = tasks.filter(t => t.type === 'essay' && t.result);
    const fraudTasks = tasks.filter(t => t.type === 'fraud' && t.result);

    if (mcqTasks.length > 0) {
      sub.score = mcqTasks.reduce((s, t) => s + (t.result?.score || 0), 0) / mcqTasks.length;
    }

    if (essayTasks.length > 0) {
      let totalWords = 0, weightedScore = 0;
      essayTasks.forEach(t => {
        const wc = (t.data.wordCount as number) || 1;
        totalWords += wc;
        weightedScore += (t.result?.plagiarismScore || 0) * wc;
      });
      sub.plagiarismScore = totalWords > 0 ? weightedScore / totalWords : 0;
    }

    if (fraudTasks.length > 0) {
      sub.fraudFlag = fraudTasks.some(t => t.result?.fraudFlag);
    }

    sub.status = 'COMPLETED';
    sub.processedAt = Date.now();
    this.emit('submission_completed', {
      submissionId: sub.id,
      score: sub.score,
      plagiarismScore: sub.plagiarismScore,
      fraudFlag: sub.fraudFlag,
      processingTimeMs: sub.processedAt - sub.submittedAt,
    });
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = Date.now();
    this.processedLatencies = [];

    this.initWorkers();

    const pending = Array.from(this.submissions.values()).filter(s => s.status === 'PENDING');
    for (const sub of pending) {
      this.decomposeSubmission(sub);
    }

    for (const worker of this.workers.values()) {
      this.assignNextTask(worker);
    }

    const metricsInterval = setInterval(() => {
      if (!this.isRunning) { clearInterval(metricsInterval); return; }
      this.emit('metrics_update', this.getMetrics());

      const subs = Array.from(this.submissions.values());
      const allDone = subs.every(s => s.status === 'COMPLETED' || s.status === 'FAILED');
      if (allDone && subs.length > 0) {
        this.isRunning = false;
        this.emit('engine_complete', this.getMetrics());
        clearInterval(metricsInterval);
      }
    }, 200);
  }

  stop() {
    this.isRunning = false;
    this.processingTimers.forEach(t => clearTimeout(t));
    this.processingTimers = [];
  }

  reset() {
    this.stop();
    this.submissions.clear();
    this.tasks.clear();
    this.workers.clear();
    this.mcqQueue = [];
    this.essayQueue = [];
    this.fraudQueue = [];
    this.resultQueue = [];
    this.deadLetterQueue = [];
    this.processedLatencies = [];
    this.correctAnswers.clear();
    this.startTime = 0;
  }

  getIsRunning() { return this.isRunning; }
}
