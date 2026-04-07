import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Cloud, Download, Users, User, CheckCircle2, RefreshCw, XCircle, Clock } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { mockDrives, mockItems, mockUsers, mockSyncRuns, formatSize, exportToCSV, DRIVE_COLORS, tooltipStyle } from "@/lib/mockData";

function SyncStatusIcon({ status }: { status: string }) {
  if (status === "succeeded") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "running") return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
  if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-muted-foreground" />;
}

const DrivesDetail = () => {
  const navigate = useNavigate();

  const driveData = mockDrives.map((d, idx) => {
    const files = mockItems.filter(i => i.drive_id === d.drive_id && i.item_type === "file");
    const folders = mockItems.filter(i => i.drive_id === d.drive_id && i.item_type === "folder");
    const size = files.reduce((a, i) => a + i.size, 0);
    const sync = mockSyncRuns.find(s => s.drive_id === d.drive_id);
    const owner = mockUsers.find(u => u.user_id === d.owner_user_id);
    return { ...d, fileCount: files.length, folderCount: folders.length, size, sync, owner, color: DRIVE_COLORS[idx % DRIVE_COLORS.length] };
  });

  const pieData = driveData.map(d => ({ name: d.name.replace("'s OneDrive", ""), value: Math.round(d.size / 1048576) }));

  const handleExport = () => {
    const headers = ["Drive", "Type", "Owner", "Files", "Folders", "Storage", "Sync Status"];
    const rows = driveData.map(d => [d.name, d.drive_type, d.owner?.name || "", String(d.fileCount), String(d.folderCount), formatSize(d.size), d.sync?.status || "unknown"]);
    exportToCSV(headers, rows, "drives_report.csv");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition"><ArrowLeft className="w-4 h-4" /></button>
            <div>
              <h1 className="text-2xl font-bold"><span className="gradient-text">Drives Overview</span></h1>
              <p className="text-xs text-muted-foreground">{mockDrives.length} drives configured across your organization</p>
            </div>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white text-xs font-medium hover:opacity-90 transition"><Download className="w-3.5 h-3.5" /> Export CSV</button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Storage Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={DRIVE_COLORS[i % DRIVE_COLORS.length]} />)}
              </Pie><RTooltip contentStyle={tooltipStyle} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} /></PieChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {driveData.map((drive, idx) => (
              <motion.div key={drive.drive_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.08 }} className="glass-card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: drive.color + "20" }}>
                      <Cloud className="w-5 h-5" style={{ color: drive.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{drive.name}</p>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${drive.drive_type === "personal" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {drive.drive_type === "personal" ? <User className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
                        {drive.drive_type === "personal" ? "Personal" : "Shared"}
                      </span>
                    </div>
                  </div>
                  {drive.sync && <SyncStatusIcon status={drive.sync.status} />}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="p-2 bg-secondary rounded-lg text-center"><p className="text-lg font-bold">{drive.fileCount}</p><p className="text-[10px] text-muted-foreground">Files</p></div>
                  <div className="p-2 bg-secondary rounded-lg text-center"><p className="text-lg font-bold">{drive.folderCount}</p><p className="text-[10px] text-muted-foreground">Folders</p></div>
                  <div className="p-2 bg-secondary rounded-lg text-center"><p className="text-sm font-bold">{formatSize(drive.size)}</p><p className="text-[10px] text-muted-foreground">Storage</p></div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-muted-foreground">Owner: <span className="text-foreground">{drive.owner?.name || "—"}</span></p>
                  {drive.sync && <p className="text-[10px] text-muted-foreground">Last sync: {new Date(drive.sync.run_started_at).toLocaleString()} · <Badge variant="outline" className={`text-[9px] border-0 ${drive.sync.status === "succeeded" ? "bg-emerald-100 text-emerald-700" : drive.sync.status === "running" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>{drive.sync.status}</Badge></p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Drive Comparison</h3>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border">
              {["Drive", "Type", "Owner", "Files", "Folders", "Storage", "Sync Status", "Last Sync"].map(h => <th key={h} className="text-left p-2.5 text-muted-foreground font-medium text-[10px] uppercase tracking-wider">{h}</th>)}
            </tr></thead>
            <tbody>
              {driveData.map(d => (
                <tr key={d.drive_id} className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="p-2.5 font-medium">{d.name}</td>
                  <td className="p-2.5 capitalize">{d.drive_type}</td>
                  <td className="p-2.5 text-muted-foreground">{d.owner?.name || "—"}</td>
                  <td className="p-2.5">{d.fileCount}</td>
                  <td className="p-2.5">{d.folderCount}</td>
                  <td className="p-2.5">{formatSize(d.size)}</td>
                  <td className="p-2.5"><Badge variant="outline" className={`text-[9px] border-0 ${d.sync?.status === "succeeded" ? "bg-emerald-100 text-emerald-700" : d.sync?.status === "running" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>{d.sync?.status || "—"}</Badge></td>
                  <td className="p-2.5 text-muted-foreground">{d.sync ? new Date(d.sync.run_started_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
};

export default DrivesDetail;
