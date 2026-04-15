import { Card } from "@/components/ui/card";
import { Users, Search, UserPlus, Shield } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý Người dùng</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Quản lý tài khoản sinh viên, giảng viên và quản trị viên</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Tổng người dùng</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-success" />
          <div>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Mới trong tháng</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-3">
          <Shield className="w-8 h-8 text-accent" />
          <div>
            <p className="text-2xl font-bold text-foreground">—</p>
            <p className="text-xs text-muted-foreground">Quản trị viên</p>
          </div>
        </Card>
      </div>

      <Card className="p-8 text-center border-dashed">
        <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-foreground font-medium">Chức năng đang phát triển</p>
        <p className="text-muted-foreground text-sm mt-1">Quản lý tài khoản, phân quyền RBAC, import danh sách sinh viên</p>
      </Card>
    </div>
  );
}
