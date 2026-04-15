import { Card } from "@/components/ui/card";
import { BookOpen, Calendar, Clock, Search } from "lucide-react";

export default function ExamsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quản lý Kỳ thi</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Tạo và quản lý các kỳ thi trực tuyến</p>
      </div>

      <Card className="p-8 text-center border-dashed">
        <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-foreground font-medium">Chức năng đang phát triển</p>
        <p className="text-muted-foreground text-sm mt-1">Tạo kỳ thi, thiết lập thời gian, cấu hình chấm điểm, quản lý ca thi</p>
      </Card>
    </div>
  );
}
