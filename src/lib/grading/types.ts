// Core types for the grading engine

export type TaskType = 'mcq' | 'essay' | 'fraud';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
export type SubmissionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ExamType = 'MCQ' | 'ESSAY' | 'MIXED';

export interface Task {
  id: string;
  submissionId: string;
  type: TaskType;
  status: TaskStatus;
  workerId?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  data: Record<string, unknown>;
  result?: TaskResult;
}

export interface TaskResult {
  score?: number;
  plagiarismScore?: number;
  fraudFlag?: boolean;
  fraudDetail?: string;
  matchedSource?: string;
  processingTimeMs: number;
  workerId: string;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  examId: string;
  type: ExamType;
  status: SubmissionStatus;
  content: Record<string, unknown>;
  submittedAt: number;
  processedAt?: number;
  score?: number;
  plagiarismScore?: number;
  fraudFlag?: boolean;
  taskIds: string[];
}

export interface Worker {
  id: string;
  type: TaskType;
  status: 'idle' | 'busy' | 'stopped' | 'failed';
  currentTaskId?: string;
  tasksProcessed: number;
  totalProcessingTime: number;
  lastHeartbeat: number;
  isAlive: boolean;
}

export interface QueueStats {
  mcqQueue: number;
  essayQueue: number;
  fraudQueue: number;
  resultQueue: number;
  deadLetterQueue: number;
}

export interface EngineMetrics {
  totalSubmissions: number;
  completedSubmissions: number;
  failedSubmissions: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  retriedTasks: number;
  avgProcessingTimeMs: number;
  throughputPerMinute: number;
  startTime: number;
  elapsedMs: number;
  p95LatencyMs: number;
}

export interface GradingEngineConfig {
  workerCount: { mcq: number; essay: number; fraud: number };
  mcqProcessingTimeMs: number;
  essayProcessingTimeMs: number;
  fraudProcessingTimeMs: number;
  enableFaultSimulation: boolean;
  faultProbability: number;
  visibilityTimeoutMs: number;
  maxRetries: number;
  chunkSize: number;
  chunkOverlap: number;
}

export const DEFAULT_CONFIG: GradingEngineConfig = {
  workerCount: { mcq: 3, essay: 2, fraud: 1 },
  mcqProcessingTimeMs: 50,
  essayProcessingTimeMs: 150,
  fraudProcessingTimeMs: 200,
  enableFaultSimulation: false,
  faultProbability: 0.05,
  visibilityTimeoutMs: 5000,
  maxRetries: 3,
  chunkSize: 200,
  chunkOverlap: 20,
};

export type EngineEventType =
  | 'submission_received' | 'task_created' | 'task_assigned'
  | 'task_completed' | 'task_failed' | 'task_retried'
  | 'submission_completed' | 'worker_started' | 'worker_stopped'
  | 'worker_fault' | 'dead_letter' | 'metrics_update' | 'engine_complete';

export interface EngineEvent {
  type: EngineEventType;
  timestamp: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}
