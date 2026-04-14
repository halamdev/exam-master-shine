import { Card } from "@/components/ui/card";
import { ArrowDown, ArrowRight, Database, Cpu, Layers, Globe, Shield, Server } from "lucide-react";

const layers = [
  { name: "Client Layer", icon: Globe, items: ["Web Browser", "Mobile App"], desc: "Giao diện làm bài, dashboard giảng viên", color: "border-primary/30 bg-primary/5" },
  { name: "API Gateway", icon: Shield, items: ["REST API Server"], desc: "Xác thực JWT, định tuyến, rate limiting", color: "border-accent/30 bg-accent/5" },
  { name: "Master Layer", icon: Server, items: ["Coordinator", "Task Decomposer", "Aggregator"], desc: "Nhận bài → chia task → đẩy queue → tổng hợp kết quả", color: "border-warning/30 bg-warning/5" },
  { name: "Queue Layer", icon: Database, items: ["mcq_queue", "essay_queue", "result_queue", "dead_letter_queue"], desc: "Redis List (LPUSH/BRPOP) - Buffer task, đảm bảo không mất dữ liệu", color: "border-destructive/30 bg-destructive/5" },
  { name: "Slave Layer", icon: Cpu, items: ["MCQ Worker ×N", "Essay Worker ×N", "Fraud Worker ×N"], desc: "Stateless workers - scale ngang không giới hạn", color: "border-success/30 bg-success/5" },
  { name: "Storage Layer", icon: Layers, items: ["PostgreSQL", "Redis Cache", "Corpus DB"], desc: "Lưu submissions, results, corpus đạo văn", color: "border-info/30 bg-info/5" },
];

const flows = [
  {
    title: "Luồng chấm MCQ",
    steps: [
      "Sinh viên nhấn Nộp bài → POST /api/submissions",
      "API Gateway xác thực JWT → Master",
      "Master lưu Submission(PENDING) vào PostgreSQL",
      "Task Decomposer tạo MCQTask → LPUSH mcq_queue",
      "MCQ Worker BRPOP task → chấm điểm → LPUSH result_queue",
      "Aggregator BRPOP kết quả → tổng hợp điểm",
      "Cập nhật Result → status=COMPLETED",
    ],
  },
  {
    title: "Luồng chấm Essay",
    steps: [
      "Chia văn bản thành K chunks (200 từ, overlap 20 từ)",
      "Tạo K ScanJob → LPUSH essay_queue",
      "Essay Workers xử lý song song: cosine similarity",
      "Mỗi worker trả ChunkResult (plagiarism_score)",
      "Aggregator tổng hợp: score = Σ(score_i × words_i) / Σ(words_i)",
      "plagiarism > 0.3 → trigger Fraud Detection",
    ],
  },
];

export default function ArchitecturePage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kiến Trúc Hệ Thống</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Master-Slave (Coordinator–Worker) với Message Queue</p>
      </div>

      {/* Layer Diagram */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Component Diagram</h2>
        {layers.map((layer, i) => (
          <div key={layer.name}>
            <Card className={`p-4 border ${layer.color}`}>
              <div className="flex items-start gap-4">
                <layer.icon className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-sm text-foreground">{layer.name}</h3>
                    {layer.items.map(item => (
                      <span key={item} className="queue-badge bg-muted text-muted-foreground">{item}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{layer.desc}</p>
                </div>
              </div>
            </Card>
            {i < layers.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="w-4 h-4 text-muted-foreground/50" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Processing Flows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {flows.map(flow => (
          <Card key={flow.title} className="p-5">
            <h3 className="font-semibold text-sm text-foreground mb-3">{flow.title}</h3>
            <ol className="space-y-2">
              {flow.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>

      {/* ADRs */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Architectural Decision Records</h2>
        <div className="space-y-3">
          <AdrCard
            id="ADR-001"
            title="Redis List làm Message Queue"
            reason="Redis đã có trong stack, đủ throughput cho prototype, đơn giản hóa deployment"
            tradeoff="Production có thể migrate sang Kafka cho replay và consumer group"
          />
          <AdrCard
            id="ADR-002"
            title="Essay Chunking với Overlap"
            reason="Chunk 200 từ, overlap 20 từ đảm bảo không bỏ sót đạo văn ở biên"
            tradeoff="Tăng ~10% số task cần xử lý"
          />
          <AdrCard
            id="ADR-003"
            title="Stateless Workers"
            reason="Cho phép spawn/kill worker bất kỳ lúc nào, scale linh hoạt"
            tradeoff="Mọi thông tin phải đi kèm trong task message"
          />
        </div>
      </div>

      {/* Non-functional */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm text-foreground mb-3">Yêu cầu Phi Chức năng</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <NfItem label="Performance" value="P95 latency chấm MCQ < 3 giây" />
          <NfItem label="Scalability" value="Scale worker 1 → N không downtime" />
          <NfItem label="Fault Tolerance" value="Retry 3 lần, dead-letter queue" />
          <NfItem label="Availability" value="Queue bền vững, uptime 99.9%" />
          <NfItem label="Extensibility" value="Worker plug-in interface chuẩn" />
          <NfItem label="Security" value="JWT auth, HTTPS, RBAC" />
        </div>
      </Card>
    </div>
  );
}

function AdrCard({ id, title, reason, tradeoff }: { id: string; title: string; reason: string; tradeoff: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="queue-badge bg-primary/10 text-primary font-bold">{id}</span>
        <h4 className="font-medium text-sm text-foreground">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground"><strong>Lý do:</strong> {reason}</p>
      <p className="text-xs text-muted-foreground mt-1"><strong>Đánh đổi:</strong> {tradeoff}</p>
    </Card>
  );
}

function NfItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <ArrowRight className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
      <div>
        <span className="font-medium text-foreground">{label}:</span>{" "}
        <span className="text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}
