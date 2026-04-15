import { Card } from "@/components/ui/card";
import { BookOpen, Calendar, Clock, Search } from "lucide-react";

export default function ExamsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quản lý Kỳ thi</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Tạo và quản lý các kỳ thi trực tuyến</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          <div>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Kỳ thi đang mở</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-accent" />
          <div>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Sắp diễn ra</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-3">
          <Clock className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Đã kết thúc</p>
          </div>
        </Card>
      </div>

      <Card className="p-8 text-center border-dashed">
        <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-foreground font-medium">Chức năng đang phát triển</p>
        <p className="text-muted-foreground text-sm mt-1">Tạo kỳ thi, thiết lập thời gian, cấu hình chấm điểm, quản lý ca thi</p>
      </Card>
    </div>
  );
}
