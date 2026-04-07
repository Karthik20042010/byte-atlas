import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GitBranch, Download, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { mockItems, mockDrives, mockUsers, mockFileVersions, formatSize, exportToCSV, tooltipStyle } from "@/lib/mockData";

const VersionsDetail = () => {
  const navigate = useNavigate();

  const versionCounts: Record<string, number> = {};
  mockFileVersions.forEach(v => { versionCounts[v.item_id] = (versionCounts[v.item_id] || 0) + 1; });
  const multiVersionFiles = Object.entries(versionCounts).filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);
  const singleVersionFiles = Object.entries(versionCounts).filter(([, c]) => c === 1).length;
  const totalVersions = mockFileVersions.length;

  const chartData = multiVersionFiles.map(([itemId, count]) => {
    const item = mockItems.find(i => i.item_id === itemId)!;
    return { name: item.name.length > 20 ? item.name.slice(0, 20) + "…" : item.name, versions: count };
  });

  const handleExport = () => {
    const headers = ["File", "Drive", "Versions", "Size", "Last Modified"];
    const rows = Object.entries(versionCounts).sort((a, b) => b[1] - a[1]).map(([itemId, count]) => {
      const item = mockItems.find(i => i.item_id === itemId)!;
      const drive = mockDrives.find(d => d.drive_id === item.drive_id)?.name || "";
      return [item.name, drive, String(count), formatSize(item.size), item.last_modified_at];
    });
    exportToCSV(headers, rows, "file_versions_report.csv");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition"><ArrowLeft className="w-4 h-4" /></button>
            <div>
              <h1 className="text-2xl font-bold"><span className="gradient-text">File Version History</span></h1>
              <p className="text-xs text-muted-foreground">{totalVersions} versions across {Object.keys(versionCounts).length} versioned files</p>
            </div>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white text-xs font-medium hover:opacity-90 transition"><Download className="w-3.5 h-3.5" /> Export CSV</button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Versions", value: totalVersions, color: "bg-sky-100 text-sky-600" },
            { label: "Multi-Version Files", value: multiVersionFiles.length, color: "bg-violet-100 text-violet-600" },
            { label: "Single Version", value: singleVersionFiles, color: "bg-emerald-100 text-emerald-600" },
            { label: "Max Versions", value: multiVersionFiles[0]?.[1] || 0, color: "bg-amber-100 text-amber-600" },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color} mb-3`}><GitBranch className="w-5 h-5" /></div>
              <p className="text-xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Version Count by File</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(220,9%,46%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
              <RTooltip contentStyle={tooltipStyle} />
              <Bar dataKey="versions" radius={[4, 4, 0, 0]} fill="hsl(262,83%,58%)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="space-y-4">
          {Object.entries(versionCounts).sort((a, b) => b[1] - a[1]).map(([itemId, count]) => {
            const item = mockItems.find(i => i.item_id === itemId)!;
            const drive = mockDrives.find(d => d.drive_id === item.drive_id);
            const versions = mockFileVersions.filter(v => v.item_id === itemId).sort((a, b) => a.version_number - b.version_number);
            return (
              <motion.div key={itemId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{drive?.name} · {item.path_display}</p>
                  </div>
                  <Badge className="bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border-0 text-[10px]">{count} versions</Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {versions.map(v => (
                    <div key={v.version_id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${v.is_current ? "bg-emerald-100 text-emerald-700 font-medium" : "bg-muted text-muted-foreground"}`}>
                      <span>v{v.version_number}</span>
                      {v.is_current && <CheckCircle2 className="w-3 h-3" />}
                      <span className="text-[10px]">by {mockUsers.find(u => u.user_id === v.created_by)?.name.split(" ")[0] || "—"}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VersionsDetail;
