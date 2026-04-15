import { Card } from "@/components/ui/card";
import { Shield, AlertTriangle, Eye, Search } from "lucide-react";

export default function FraudDetectionPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Phát hiện Gian lận</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Giám sát và phát hiện các hành vi gian lận trong thi cử</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <div>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Cảnh báo chờ xử lý</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-3">
          <Eye className="w-8 h-8 text-warning" />
          <div>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Đang giám sát</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-3">
          <Shield className="w-8 h-8 text-success" />
          <div>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Đã xác minh</p>
          </div>
        </Card>
      </div>

      <Card className="p-8 text-center border-dashed">
        <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-foreground font-medium">Chức năng đang phát triển</p>
        <p className="text-muted-foreground text-sm mt-1">Phát hiện đạo văn, so sánh mẫu câu trả lời, giám sát hành vi bất thường</p>
      </Card>
    </div>
  );
}
