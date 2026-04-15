import { useState, useRef, useCallback, useEffect } from "react";
import { GradingEngine, type EngineMetrics, type EngineEvent, type QueueStats, type Worker as WorkerType, type ExamType, type GradingEngineConfig } from "@/lib/grading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play, Square, RotateCcw, Zap, AlertTriangle,
  CheckCircle2, XCircle, Clock, Cpu, Database,
  ArrowRight, Skull, Heart, BarChart3, TrendingUp
} from "lucide-react";

type ViewMode = 'test' | 'benchmark';

export default function MetricsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('test');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kiểm thử Hiệu năng</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Môi trường test cấu hình và benchmark kiến trúc Master-Slave</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode('test')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'test' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Cpu className="w-4 h-4 inline mr-1" />Stress Test
          </button>
          <button
            onClick={() => setViewMode('benchmark')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'benchmark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1" />Benchmark
          </button>
        </div>
      </div>

      {viewMode === 'test' ? <StressTestPanel /> : <BenchmarkPanel />}
    </div>
  );
}

// ====== Stress Test (moved from old GradingDemo) ======

function StressTestPanel() {
  const engineRef = useRef<GradingEngine | null>(null);
  const [metrics, setMetrics] = useState<EngineMetrics | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [workers, setWorkers] = useState<WorkerType[]>([]);
  const [events, setEvents] = useState<EngineEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

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
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-2">
        {!isRunning && !isComplete && (
          <Button onClick={handleStart} className="gap-2">
            <Play className="w-4 h-4" /> Bắt đầu Test
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

      {/* Config Panel */}
      {!isRunning && !isComplete && (
        <Card className="p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Cấu hình Test</h3>
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
                <input type="checkbox" checked={enableFaults} onChange={e => setEnableFaults(e.target.checked)} className="rounded" />
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
            <span className="text-muted-foreground font-mono">{(metrics.elapsedMs / 1000).toFixed(1)}s</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Stats Row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
            <h3 className="font-semibold text-foreground">Test hoàn thành!</h3>
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

// ====== Benchmark Panel ======

interface BenchmarkResult {
  label: string;
  workerCount: number;
  metrics: EngineMetrics;
}

function BenchmarkPanel() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentLabel, setCurrentLabel] = useState('');
  const [progress, setProgress] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(500);
  const [examType, setExamType] = useState<ExamType>('MCQ');

  const runBenchmark = async (label: string, workerCount: number): Promise<BenchmarkResult> => {
    return new Promise(resolve => {
      const engine = new GradingEngine({
        workerCount: { mcq: workerCount, essay: workerCount, fraud: 1 },
      });
      engine.generateSubmissions(submissionCount, examType);
      engine.on(event => {
        if (event.type === 'metrics_update') {
          const m = event.data as unknown as EngineMetrics;
          if (m.totalSubmissions > 0) setProgress((m.completedSubmissions / m.totalSubmissions) * 100);
        }
        if (event.type === 'engine_complete') {
          const metrics = engine.getMetrics();
          engine.stop();
          resolve({ label, workerCount, metrics });
        }
      });
      engine.start();
    });
  };

  const handleRunAll = async () => {
    setIsRunning(true);
    setResults([]);
    const configs = [
      { label: '1 Worker', count: 1 },
      { label: '2 Workers', count: 2 },
      { label: '3 Workers', count: 3 },
    ];
    const allResults: BenchmarkResult[] = [];
    for (const config of configs) {
      setCurrentLabel(config.label);
      setProgress(0);
      const result = await runBenchmark(config.label, config.count);
      allResults.push(result);
      setResults([...allResults]);
    }
    setIsRunning(false);
    setCurrentLabel('');
  };

  const maxTime = results.length > 0 ? Math.max(...results.map(r => r.metrics.elapsedMs)) : 1;
  const maxThroughput = results.length > 0 ? Math.max(...results.map(r => r.metrics.throughputPerMinute)) : 1;

  return (
    <div className="space-y-6">
      {!isRunning && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Số bài:</label>
            <input type="number" value={submissionCount} onChange={e => setSubmissionCount(+e.target.value)}
              className="w-20 px-2 py-1 rounded border border-input bg-background text-sm" min={50} max={2000} />
          </div>
          <select value={examType} onChange={e => setExamType(e.target.value as ExamType)}
            className="px-2 py-1 rounded border border-input bg-background text-sm">
            <option value="MCQ">MCQ</option>
            <option value="ESSAY">Essay</option>
            <option value="MIXED">Mixed</option>
          </select>
          <Button onClick={handleRunAll} className="gap-2">
            <Play className="w-4 h-4" /> Chạy Benchmark
          </Button>
        </div>
      )}

      {isRunning && (
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="worker-indicator bg-primary" />
            <span className="text-sm font-medium text-foreground">Đang chạy: {currentLabel}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </Card>
      )}

      {results.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Kết quả Benchmark
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">Metric</th>
                  {results.map(r => (
                    <th key={r.label} className="text-right py-2 px-3 text-foreground font-medium text-xs">{r.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <MetricRow label="Thời gian tổng" values={results.map(r => `${(r.metrics.elapsedMs / 1000).toFixed(2)}s`)} />
                <MetricRow label="Throughput (bài/phút)" values={results.map(r => r.metrics.throughputPerMinute.toFixed(0))} />
                <MetricRow label="Avg Latency" values={results.map(r => `${r.metrics.avgProcessingTimeMs.toFixed(0)}ms`)} />
                <MetricRow label="P95 Latency" values={results.map(r => `${r.metrics.p95LatencyMs.toFixed(0)}ms`)} />
                <MetricRow label="Tasks hoàn thành" values={results.map(r => String(r.metrics.completedTasks))} />
                <MetricRow label="Tỉ lệ thành công" values={results.map(r => `${r.metrics.totalTasks > 0 ? ((r.metrics.completedTasks / r.metrics.totalTasks) * 100).toFixed(1) : 0}%`)} />
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" /> Thời gian xử lý
            </h3>
            <div className="space-y-3">
              {results.map(r => (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium text-foreground">{(r.metrics.elapsedMs / 1000).toFixed(2)}s</span>
                  </div>
                  <div className="h-6 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-warning/70 rounded transition-all duration-500" style={{ width: `${(r.metrics.elapsedMs / maxTime) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-success" /> Throughput (bài/phút)
            </h3>
            <div className="space-y-3">
              {results.map(r => (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium text-foreground">{r.metrics.throughputPerMinute.toFixed(0)}</span>
                  </div>
                  <div className="h-6 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-success/70 rounded transition-all duration-500" style={{ width: `${(r.metrics.throughputPerMinute / maxThroughput) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {results.length >= 2 && (
        <Card className="p-5 border-primary/20">
          <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Phân tích Scalability
          </h3>
          <div className="text-xs text-muted-foreground space-y-2">
            <p>
              <CheckCircle2 className="w-3 h-3 text-success inline mr-1" />
              Speedup 1→{results[results.length - 1].workerCount} workers: <strong className="text-foreground">
                {(results[0].metrics.elapsedMs / results[results.length - 1].metrics.elapsedMs).toFixed(2)}x
              </strong> (lý tưởng: {results[results.length - 1].workerCount}.00x)
            </p>
            <p>
              <CheckCircle2 className="w-3 h-3 text-success inline mr-1" />
              Throughput tăng gần tuyến tính, chứng minh kiến trúc Master-Slave scale hiệu quả.
            </p>
            <p>
              <CheckCircle2 className="w-3 h-3 text-success inline mr-1" />
              Workers stateless — có thể thêm/bớt worker mà không cần thay đổi Master.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ====== Shared Components ======

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

function MetricRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <td className="py-2 px-3 text-muted-foreground text-xs">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-2 px-3 text-right font-mono text-xs text-foreground">{v}</td>
      ))}
    </tr>
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
    case 'worker_fault': return `⚠️ Worker ${e.data.workerId} FAULT`;
    case 'dead_letter': return `💀 Task ${(e.data.taskId as string).slice(-6)} → DLQ`;
    default: return e.type;
  }
}
