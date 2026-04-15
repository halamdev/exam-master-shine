import { Card } from "@/components/ui/card";
import { FileText, Database, Tag, Search } from "lucide-react";

export default function QuestionBankPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ngân hàng Đề thi</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Quản lý câu hỏi trắc nghiệm và tự luận</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Tổng câu hỏi</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-3">
          <Database className="w-8 h-8 text-accent" />
          <div>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Bộ đề thi</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-3">
          <Tag className="w-8 h-8 text-warning" />
          <div>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Chủ đề</p>
          </div>
        </Card>
      </div>

      <Card className="p-8 text-center border-dashed">
        <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-foreground font-medium">Chức năng đang phát triển</p>
        <p className="text-muted-foreground text-sm mt-1">Soạn câu hỏi, phân loại theo chủ đề, import từ file, tạo đề thi tự động</p>
      </Card>
    </div>
  );
}
