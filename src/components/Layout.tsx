import { NavLink, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, Play, Network, BarChart3, 
  Users, FileText, BookOpen, Shield, Settings,
  GraduationCap
} from "lucide-react";

const mainNav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/grading-demo", icon: Play, label: "Demo Chấm Bài" },
  { to: "/architecture", icon: Network, label: "Kiến Trúc" },
  { to: "/metrics", icon: BarChart3, label: "Metrics" },
];

const managementNav = [
  { to: "#", icon: Users, label: "Quản lý Người dùng" },
  { to: "#", icon: BookOpen, label: "Quản lý Kỳ thi" },
  { to: "#", icon: FileText, label: "Ngân hàng Đề thi" },
  { to: "#", icon: Shield, label: "Phát hiện Gian lận" },
  { to: "#", icon: Settings, label: "Cài đặt Hệ thống" },
];

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground">ExamGrader</h1>
              <p className="text-[11px] text-sidebar-muted">Master-Slave Architecture</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-sidebar-muted font-semibold px-3 mb-2">
              Demo
            </p>
            <div className="space-y-0.5">
              {mainNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-sidebar-muted font-semibold px-3 mb-2">
              Quản lý
            </p>
            <div className="space-y-0.5">
              {managementNav.map(item => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidebar-muted cursor-not-allowed opacity-60"
                  title="Chức năng demo - chưa triển khai"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 rounded-md bg-sidebar-accent/50 text-[11px] text-sidebar-muted">
            Demo KTPM • Kiến trúc Master-Slave
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
