import { useState, useRef, useCallback, useEffect } from "react";
import { GradingEngine, type EngineMetrics, type Submission, type ExamType } from "@/lib/grading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play, RotateCcw, CheckCircle2, AlertTriangle,
  FileSearch, Eye, Flag, Download
} from "lucide-react";

type ViewTab = 'results' | 'violations';

export default function GradingDemo() {
  const engineRef = useRef<GradingEngine | null>(null);
  const [metrics, setMetrics] = useState<EngineMetrics | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('results');

  // Simple config
  const [submissionCount, setSubmissionCount] = useState(200);
  const [examType, setExamType] = useState<ExamType>('MIXED');

  const refreshState = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setMetrics(engine.getMetrics());
    setSubmissions(engine.getSubmissions());
  }, []);

  useEffect(() => {
    return () => { engineRef.current?.stop(); };
  }, []);

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(refreshState, 500);
      return () => clearInterval(interval);
    }
  }, [isRunning, refreshState]);

  const handleStart = () => {
    const engine = new GradingEngine({
      workerCount: { mcq: 3, essay: 2, fraud: 1 },
    });
    engineRef.current = engine;

    engine.on(event => {
      if (event.type === 'engine_complete') {
        setIsComplete(true);
        setIsRunning(false);
        setMetrics(engine.getMetrics());
        setSubmissions(engine.getSubmissions());
      }
      if (event.type === 'metrics_update') {
        setMetrics(event.data as unknown as EngineMetrics);
      }
    });

    engine.generateSubmissions(submissionCount, examType);
    setIsComplete(false);
    setIsRunning(true);
    setSubmissions([]);
    engine.start();
    refreshState();
  };

  const handleReset = () => {
    engineRef.current?.stop();
    engineRef.current = null;
    setMetrics(null);
    setSubmissions([]);
    setIsRunning(false);
    setIsComplete(false);
  };

  const progress = metrics
    ? (metrics.totalSubmissions > 0 ? (metrics.completedSubmissions / metrics.totalSubmissions) * 100 : 0)
    : 0;

  const completedSubs = submissions.filter(s => s.status === 'COMPLETED');
  const violationSubs = completedSubs.filter(
    s => (s.plagiarismScore && s.plagiarismScore > 0.25) || s.fraudFlag
  );

  const avgScore = completedSubs.length > 0
    ? completedSubs.reduce((sum, s) => sum + (s.score || 0), 0) / completedSubs.length
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chấm Bài Thi</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Mô phỏng luồng nộp bài → phân tách → chấm điểm → tổng hợp kết quả
          </p>
        </div>
        <div className="flex gap-2">
          {!isRunning && !isComplete && (
            <Button onClick={handleStart} className="gap-2">
              <Play className="w-4 h-4" /> Bắt đầu Chấm bài
            </Button>
          )}
          {(isRunning || isComplete) && (
            <Button onClick={handleReset} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" /> Làm mới
            </Button>
          )}
        </div>
      </div>

      {/* Config - only before start */}
      {!isRunning && !isComplete && (
        <Card className="p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Thiết lập Kỳ thi</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Số lượng bài thi</label>
              <input
                type="number" value={submissionCount}
                onChange={e => setSubmissionCount(Math.max(10, Math.min(2000, +e.target.value)))}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                min={10} max={2000}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Hình thức thi</label>
              <select
                value={examType}
                onChange={e => setExamType(e.target.value as ExamType)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="MCQ">Trắc nghiệm</option>
                <option value="ESSAY">Tự luận</option>
                <option value="MIXED">Kết hợp (Trắc nghiệm + Tự luận)</option>
              </select>
            </div>
            <div className="flex items-end">
              <p className="text-xs text-muted-foreground">
                Hệ thống sẽ sử dụng kiến trúc Master-Slave với 3 MCQ Workers, 2 Essay Workers và 1 Fraud Worker để chấm bài song song.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Progress */}
      {metrics && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isRunning ? 'Đang chấm bài...' : 'Hoàn tất'} — {metrics.completedSubmissions}/{metrics.totalSubmissions} bài
            </span>
            <span className="text-muted-foreground font-mono">
              {(metrics.elapsedMs / 1000).toFixed(1)}s
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Summary Stats - show after complete */}
      {isComplete && metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Tổng bài chấm"
            value={String(metrics.completedSubmissions)}
            sub={`${metrics.totalTasks} tasks xử lý`}
            icon={<CheckCircle2 className="w-5 h-5 text-success" />}
          />
          <SummaryCard
            label="Điểm trung bình"
            value={avgScore.toFixed(2)}
            sub="Thang điểm 10"
            icon={<FileSearch className="w-5 h-5 text-primary" />}
          />
          <SummaryCard
            label="Bài vi phạm"
            value={String(violationSubs.length)}
            sub={`${completedSubs.length > 0 ? ((violationSubs.length / completedSubs.length) * 100).toFixed(1) : 0}% tổng số`}
            icon={<AlertTriangle className="w-5 h-5 text-warning" />}
          />
          <SummaryCard
            label="Thời gian xử lý"
            value={`${(metrics.elapsedMs / 1000).toFixed(1)}s`}
            sub={`${metrics.throughputPerMinute.toFixed(0)} bài/phút`}
            icon={<Play className="w-5 h-5 text-accent" />}
          />
        </div>
      )}

      {/* Results Tabs */}
      {isComplete && completedSubs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-1 border-b border-border">
            <TabButton
              active={activeTab === 'results'}
              onClick={() => setActiveTab('results')}
              icon={<FileSearch className="w-4 h-4" />}
              label={`Kết quả chấm (${completedSubs.length})`}
            />
            <TabButton
              active={activeTab === 'violations'}
              onClick={() => setActiveTab('violations')}
              icon={<Flag className="w-4 h-4" />}
              label={`Vi phạm (${violationSubs.length})`}
            />
          </div>

          {activeTab === 'results' && (
            <ResultsTable submissions={completedSubs} examType={examType} />
          )}
          {activeTab === 'violations' && (
            <ViolationsTable submissions={violationSubs} />
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <Card className="p-4 flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </Card>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function ResultsTable({ submissions, examType }: { submissions: Submission[]; examType: ExamType }) {
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const totalPages = Math.ceil(submissions.length / pageSize);
  const pageSubs = submissions.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">STT</th>
              <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Sinh viên</th>
              <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Mã SV</th>
              {(examType === 'MCQ' || examType === 'MIXED') && (
                <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">Điểm</th>
              )}
              {(examType === 'ESSAY' || examType === 'MIXED') && (
                <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">Đạo văn</th>
              )}
              <th className="text-center py-2.5 px-4 text-xs font-medium text-muted-foreground">Trạng thái</th>
              <th className="text-center py-2.5 px-4 text-xs font-medium text-muted-foreground">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageSubs.map((sub, i) => (
              <tr key={sub.id} className="hover:bg-muted/20">
                <td className="py-2 px-4 text-xs text-muted-foreground">{page * pageSize + i + 1}</td>
                <td className="py-2 px-4 text-sm font-medium text-foreground">{sub.studentName}</td>
                <td className="py-2 px-4 text-xs text-muted-foreground font-mono">{sub.studentId.slice(-8)}</td>
                {(examType === 'MCQ' || examType === 'MIXED') && (
                  <td className="py-2 px-4 text-right">
                    <span className={`font-bold ${(sub.score || 0) >= 5 ? 'text-success' : 'text-destructive'}`}>
                      {(sub.score || 0).toFixed(2)}
                    </span>
                  </td>
                )}
                {(examType === 'ESSAY' || examType === 'MIXED') && (
                  <td className="py-2 px-4 text-right">
                    {sub.plagiarismScore !== undefined ? (
                      <Badge variant={sub.plagiarismScore > 0.25 ? 'destructive' : 'secondary'} className="text-xs">
                        {(sub.plagiarismScore * 100).toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                )}
                <td className="py-2 px-4 text-center">
                  {sub.fraudFlag ? (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <AlertTriangle className="w-3 h-3" /> Gian lận
                    </Badge>
                  ) : (sub.plagiarismScore && sub.plagiarismScore > 0.25) ? (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <Flag className="w-3 h-3" /> Đạo văn
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Hợp lệ</Badge>
                  )}
                </td>
                <td className="py-2 px-4 text-center">
                  <button className="text-muted-foreground hover:text-primary transition-colors" title="Xem chi tiết">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Trang {page + 1}/{totalPages} ({submissions.length} bài)
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              Trước
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Sau
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function ViolationsTable({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
        <p className="text-foreground font-medium">Không phát hiện vi phạm</p>
        <p className="text-muted-foreground text-sm mt-1">Tất cả bài thi đều hợp lệ</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-destructive/5">
              <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Sinh viên</th>
              <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Loại vi phạm</th>
              <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">Mức độ</th>
              <th className="text-center py-2.5 px-4 text-xs font-medium text-muted-foreground">Xử lý</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {submissions.map(sub => (
              <tr key={sub.id} className="hover:bg-muted/20">
                <td className="py-2.5 px-4">
                  <p className="font-medium text-foreground text-sm">{sub.studentName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{sub.studentId.slice(-8)}</p>
                </td>
                <td className="py-2.5 px-4">
                  {sub.fraudFlag && (
                    <Badge variant="destructive" className="text-xs mr-1">Gian lận</Badge>
                  )}
                  {sub.plagiarismScore && sub.plagiarismScore > 0.25 && (
                    <Badge variant="destructive" className="text-xs">
                      Đạo văn {(sub.plagiarismScore * 100).toFixed(1)}%
                    </Badge>
                  )}
                </td>
                <td className="py-2.5 px-4 text-right">
                  <Badge variant={
                    (sub.plagiarismScore || 0) > 0.5 || sub.fraudFlag ? 'destructive' : 'secondary'
                  } className="text-xs">
                    {(sub.plagiarismScore || 0) > 0.5 || sub.fraudFlag ? 'Nghiêm trọng' : 'Cần kiểm tra'}
                  </Badge>
                </td>
                <td className="py-2.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Xem chi tiết bài làm">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Xuất báo cáo">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
