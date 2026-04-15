import { Card } from "@/components/ui/card";
import { Settings, Server, Bell, Search } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cài đặt Hệ thống</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Cấu hình chung cho hệ thống thi trực tuyến</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-3">
          <Server className="w-8 h-8 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Hệ thống</p>
            <p className="text-xs text-muted-foreground">Cấu hình server, Redis, PostgreSQL</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-3">
          <Settings className="w-8 h-8 text-accent" />
          <div>
            <p className="text-sm font-medium text-foreground">Chấm điểm</p>
            <p className="text-xs text-muted-foreground">Hệ số phạt, ngưỡng đạo văn, retry</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-3">
          <Bell className="w-8 h-8 text-warning" />
          <div>
            <p className="text-sm font-medium text-foreground">Thông báo</p>
            <p className="text-xs text-muted-foreground">Email, webhook, cảnh báo</p>
          </div>
        </Card>
      </div>

      <Card className="p-8 text-center border-dashed">
        <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-foreground font-medium">Chức năng đang phát triển</p>
        <p className="text-muted-foreground text-sm mt-1">Cấu hình worker pool, ngưỡng chấm điểm, tích hợp bên thứ ba</p>
      </Card>
    </div>
  );
}
