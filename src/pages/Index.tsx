import { Link } from "react-router-dom";
import { Play, Network, BarChart3, Cpu, Database, Layers, Zap, Shield, Users, Settings } from "lucide-react";

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
  // { to: "/architecture", icon: Network, label: "Xem Kiến Trúc", desc: "Component diagram & luồng xử lý" },
  { to: "/metrics", icon: BarChart3, label: "Kiểm Thử Hiệu Năng", desc: "Stress test & Benchmark" },
  { to: "/exams", icon: Database, label: "Quản lý Kỳ Thi", desc: "Tạo, chỉnh sửa và quản lý các kỳ thi" },
  { to: "/question-bank", icon: Layers, label: "Ngân Hàng Đề Thi", desc: "Thư viện câu hỏi, đề thi mẫu" },
  { to: "/users", icon: Users, label: "Quản lý Người Dùng", desc: "Quản lý giảng viên, sinh viên" },
  { to: "/fraud-detection", icon: Shield, label: "Phát Hiện Gian Lận", desc: "Giám sát và báo cáo hành vi gian lận" },
  { to: "/settings", icon: Settings, label: "Cài Đặt Hệ Thống", desc: "Cấu hình và tùy chỉnh ứng dụng" },
];

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hệ thống Thi Trực tuyến</h1>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
