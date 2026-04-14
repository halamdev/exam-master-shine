import { useState, useEffect, useRef, useCallback } from "react";
import { GradingEngine, type EngineEvent, type EngineMetrics, type QueueStats, type Worker as WorkerType, type ExamType, type GradingEngineConfig } from "@/lib/grading-engine";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, Square, RotateCcw, Zap, AlertTriangle, 
  CheckCircle2, XCircle, Clock, Cpu, Database, 
  ArrowRight, Skull, Heart
} from "lucide-react";

export default function GradingDemo() {
  const engineRef = useRef<GradingEngine | null>(null);
  const [metrics, setMetrics] = useState<EngineMetrics | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [workers, setWorkers] = useState<WorkerType[]>([]);
  const [events, setEvents] = useState<EngineEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Config
  const [submissionCount, setSubmissionCount] = useState(500);
  const [examType, setExamType] = useState<ExamType>('MCQ');
  const [mcqWorkers, setMcqWorkers] = useState(3);
  const [essayWorkers, setEssayWorkers] = useState(2);
  const [fraudWorkers, setFraudWorkers] = useState(1);
  const [enableFaults, setEnableFaults] = useState(false);

  const eventsEndRef = useRef<HTMLDivElement>(null);

  const refreshState = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setMetrics(engine.getMetrics());
    setQueueStats(engine.getQueueStats());
    setWorkers(engine.getWorkers());
  }, []);

  const handleEvent = useCallback((event: EngineEvent) => {
    setEvents(prev => {
      const next = [...prev, event];
      return next.length > 200 ? next.slice(-200) : next;
    });
    if (event.type === 'engine_complete') {
      setIsComplete(true);
      setIsRunning(false);
    }
    if (event.type === 'metrics_update') {
      setMetrics(event.data as unknown as EngineMetrics);
    }
  }, []);

  useEffect(() => {
    return () => { engineRef.current?.stop(); };
  }, []);

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(refreshState, 300);
      return () => clearInterval(interval);
    }
  }, [isRunning, refreshState]);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  const handleStart = () => {
    const config: Partial<GradingEngineConfig> = {
      workerCount: { mcq: mcqWorkers, essay: essayWorkers, fraud: fraudWorkers },
      enableFaultSimulation: enableFaults,
      faultProbability: 0.08,
    };

    const engine = new GradingEngine(config);
    engineRef.current = engine;

    engine.on(handleEvent);
    engine.generateSubmissions(submissionCount, examType);
    
    setEvents([]);
    setIsComplete(false);
    setIsRunning(true);
    engine.start();
    refreshState();
  };

  const handleStop = () => {
    engineRef.current?.stop();
    setIsRunning(false);
    refreshState();
  };

  const handleReset = () => {
    engineRef.current?.reset();
    setEvents([]);
    setMetrics(null);
    setQueueStats(null);
    setWorkers([]);
    setIsRunning(false);
    setIsComplete(false);
  };

  const handleKillWorker = (workerId: string) => {
    engineRef.current?.killWorker(workerId);
    refreshState();
  };

  const handleReviveWorker = (workerId: string) => {
    engineRef.current?.reviveWorker(workerId);
    refreshState();
  };

  const progress = metrics ? (metrics.totalSubmissions > 0 ? (metrics.completedSubmissions / metrics.totalSubmissions) * 100 : 0) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Demo Chấm Bài</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Mô phỏng kiến trúc Master-Slave với message queue</p>
        </div>
        <div className="flex gap-2">
          {!isRunning && !isComplete && (
            <Button onClick={handleStart} className="gap-2">
              <Play className="w-4 h-4" /> Bắt đầu Chấm
            </Button>
          )}
          {isRunning && (
            <Button onClick={handleStop} variant="destructive" className="gap-2">
              <Square className="w-4 h-4" /> Dừng
            </Button>
          )}
          <Button onClick={handleReset} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
        </div>
      </div>

      {/* Config Panel */}
      {!isRunning && !isComplete && (
        <Card className="p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Cấu hình Demo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Số bài thi</label>
              <input type="number" value={submissionCount} onChange={e => setSubmissionCount(+e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm" min={10} max={5000} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Loại bài</label>
              <select value={examType} onChange={e => setExamType(e.target.value as ExamType)}
                className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm">
                <option value="MCQ">Trắc nghiệm</option>
                <option value="ESSAY">Tự luận</option>
                <option value="MIXED">Hỗn hợp</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">MCQ Workers</label>
              <input type="number" value={mcqWorkers} onChange={e => setMcqWorkers(+e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm" min={0} max={10} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Essay Workers</label>
              <input type="number" value={essayWorkers} onChange={e => setEssayWorkers(+e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm" min={0} max={10} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Fraud Workers</label>
              <input type="number" value={fraudWorkers} onChange={e => setFraudWorkers(+e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm" min={0} max={5} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={enableFaults} onChange={e => setEnableFaults(e.target.checked)} 
                  className="rounded" />
                <span className="text-xs text-muted-foreground">Giả lập lỗi</span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Progress */}
      {metrics && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Tiến độ: {metrics.completedSubmissions}/{metrics.totalSubmissions} bài
            </span>
            <span className="text-muted-foreground font-mono">
              {(metrics.elapsedMs / 1000).toFixed(1)}s
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Stats Row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard icon={Database} label="Tổng Tasks" value={metrics.totalTasks} />
          <StatCard icon={CheckCircle2} label="Hoàn thành" value={metrics.completedTasks} color="text-success" />
          <StatCard icon={XCircle} label="Thất bại" value={metrics.failedTasks} color="text-destructive" />
          <StatCard icon={Zap} label="Throughput" value={`${metrics.throughputPerMinute.toFixed(0)}/phút`} color="text-warning" />
          <StatCard icon={Clock} label="Avg Latency" value={`${metrics.avgProcessingTimeMs.toFixed(0)}ms`} />
          <StatCard icon={AlertTriangle} label="P95 Latency" value={`${metrics.p95LatencyMs.toFixed(0)}ms`} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue Stats */}
        <Card className="p-5">
          <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" /> Redis Queues
          </h3>
          {queueStats ? (
            <div className="space-y-3">
              <QueueBar label="mcq_queue" count={queueStats.mcqQueue} max={submissionCount} color="bg-primary" />
              <QueueBar label="essay_queue" count={queueStats.essayQueue} max={submissionCount} color="bg-accent" />
              <QueueBar label="result_queue" count={queueStats.resultQueue} max={submissionCount} color="bg-success" />
              <QueueBar label="dead_letter" count={queueStats.deadLetterQueue} max={submissionCount} color="bg-destructive" />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Chưa khởi động</p>
          )}
        </Card>

        {/* Workers */}
        <Card className="p-5">
          <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" /> Workers
          </h3>
          <div className="space-y-2">
            {workers.length > 0 ? workers.map(w => (
              <div key={w.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className={`worker-indicator ${
                    w.status === 'busy' ? 'bg-warning' : 
                    w.status === 'idle' ? 'bg-success' : 
                    w.status === 'failed' ? 'bg-destructive' : 'bg-muted-foreground'
                  }`} />
                  <span className="font-mono">{w.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{w.tasksProcessed} tasks</span>
                  {w.isAlive ? (
                    <button onClick={() => handleKillWorker(w.id)} className="text-destructive hover:text-destructive/80" title="Kill worker">
                      <Skull className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => handleReviveWorker(w.id)} className="text-success hover:text-success/80" title="Revive worker">
                      <Heart className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground">Chưa khởi động</p>
            )}
          </div>
        </Card>

        {/* Event Log */}
        <Card className="p-5">
          <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-info" /> Event Log
          </h3>
          <div className="h-64 overflow-y-auto space-y-1 font-mono text-[10px]">
            {events.length > 0 ? events.slice(-50).map((e, i) => (
              <div key={i} className={`py-0.5 ${getEventColor(e.type)}`}>
                <span className="text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</span>
                {' '}{formatEvent(e)}
              </div>
            )) : (
              <p className="text-xs text-muted-foreground">Chưa có sự kiện</p>
            )}
            <div ref={eventsEndRef} />
          </div>
        </Card>
      </div>

      {/* Complete Summary */}
      {isComplete && metrics && (
        <Card className="p-6 border-success/30 bg-success/5">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-success" />
            <h3 className="font-semibold text-foreground">Hoàn thành!</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Tổng thời gian</p>
              <p className="font-bold text-foreground">{(metrics.elapsedMs / 1000).toFixed(2)}s</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Throughput</p>
              <p className="font-bold text-foreground">{metrics.throughputPerMinute.toFixed(0)} bài/phút</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Avg Latency</p>
              <p className="font-bold text-foreground">{metrics.avgProcessingTimeMs.toFixed(0)}ms</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Tasks Retry</p>
              <p className="font-bold text-foreground">{metrics.retriedTasks}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color?: string }) {
  return (
    <div className="stat-card flex items-center gap-3">
      <Icon className={`w-5 h-5 ${color || 'text-muted-foreground'}`} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-foreground text-lg animate-count-up">{value}</p>
      </div>
    </div>
  );
}

function QueueBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground font-mono">{label}</span>
        <span className="font-medium text-foreground">{count}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function getEventColor(type: string): string {
  if (type.includes('completed') || type === 'submission_completed') return 'text-success';
  if (type.includes('failed') || type === 'dead_letter') return 'text-destructive';
  if (type.includes('fault') || type.includes('stopped')) return 'text-warning';
  if (type.includes('retried')) return 'text-warning';
  return 'text-foreground';
}

function formatEvent(e: EngineEvent): string {
  switch (e.type) {
    case 'submission_received': return `📥 Submission ${(e.data.submissionId as string).slice(-6)} → ${e.data.taskCount} tasks`;
    case 'task_created': return `📋 Task ${(e.data.taskId as string).slice(-6)} [${e.data.type}]`;
    case 'task_assigned': return `⚙️ ${e.data.workerId} ← task ${(e.data.taskId as string).slice(-6)}`;
    case 'task_completed': return `✅ Task ${(e.data.taskId as string).slice(-6)} done (${e.data.processingTimeMs}ms)`;
    case 'task_failed': return `❌ Task ${(e.data.taskId as string).slice(-6)} failed`;
    case 'task_retried': return `🔄 Task ${(e.data.taskId as string).slice(-6)} retry #${e.data.retryCount}`;
    case 'submission_completed': return `🎉 Sub ${(e.data.submissionId as string).slice(-6)} score=${typeof e.data.score === 'number' ? (e.data.score as number).toFixed(1) : 'N/A'}`;
    case 'worker_started': return `🟢 Worker ${e.data.workerId} started`;
    case 'worker_stopped': return `🔴 Worker ${e.data.workerId} stopped`;
    case 'worker_fault': return `⚠️ Worker ${e.data.workerId} FAULT on task ${(e.data.taskId as string).slice(-6)}`;
    case 'dead_letter': return `💀 Task ${(e.data.taskId as string).slice(-6)} → dead letter queue`;
    default: return e.type;
  }
}
