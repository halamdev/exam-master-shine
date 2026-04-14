import { Link } from "react-router-dom";
import { Play, Network, BarChart3, Cpu, Database, Layers, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Master-Slave Grading",
    description: "Phân tán chấm bài qua nhiều worker, xử lý song song hàng nghìn bài thi",
    color: "text-primary",
  },
  {
    icon: Layers,
    title: "Message Queue",
    description: "Redis Queue giả lập buffer task, đảm bảo không mất dữ liệu khi worker bận",
    color: "text-accent",
  },
  {
    icon: Zap,
    title: "Scale Workers",
    description: "Tăng/giảm worker linh hoạt, throughput tỉ lệ tuyến tính với số worker",
    color: "text-warning",
  },
  {
    icon: Shield,
    title: "Fault Tolerance",
    description: "Tự phục hồi khi worker lỗi, retry tối đa 3 lần, dead-letter queue",
    color: "text-destructive",
  },
];

const quickActions = [
  { to: "/grading-demo", icon: Play, label: "Chạy Demo Chấm Bài", desc: "Sinh dữ liệu và chấm bài với Master-Slave" },
  { to: "/architecture", icon: Network, label: "Xem Kiến Trúc", desc: "Component diagram & luồng xử lý" },
  { to: "/metrics", icon: BarChart3, label: "So Sánh Metrics", desc: "Benchmark 1 vs 3 workers" },
];

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hệ thống Thi Trực tuyến</h1>
        <p className="text-muted-foreground mt-1">
          Demo kiến trúc Master-Slave cho module chấm bài phân tán
        </p>
      </div>

      {/* Architecture Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map(f => (
          <div key={f.title} className="stat-card">
            <f.icon className={`w-8 h-8 ${f.color} mb-3`} />
            <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Bắt đầu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map(a => (
            <Link
              key={a.to}
              to={a.to}
              className="stat-card flex items-start gap-4 group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <a.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{a.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Architecture Summary */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Tổng quan Kiến trúc
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-foreground mb-2">Client Layer</h4>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Giao diện làm bài, dashboard giảng viên. Giao tiếp REST API với Master.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Master Layer</h4>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Coordinator nhận bài, phân tích, chia task. Aggregator tổng hợp kết quả.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Slave Layer</h4>
            <p className="text-muted-foreground text-xs leading-relaxed">
              MCQ Worker, Essay Worker, Fraud Worker xử lý song song qua Redis Queue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
