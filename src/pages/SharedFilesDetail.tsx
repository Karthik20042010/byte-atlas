import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Download, Eye, Edit3, Shield, Users, User } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { mockItems, mockDrives, mockUsers, mockPermissions, mockSubjects, formatSize, exportToCSV, tooltipStyle } from "@/lib/mockData";

const SharedFilesDetail = () => {
  const navigate = useNavigate();

  const sharedItemIds = new Set(mockPermissions.filter(p => p.role !== "owner").map(p => p.item_id));
  const sharedFiles = mockItems.filter(i => sharedItemIds.has(i.item_id) && i.item_type === "file");

  const roleCount = { owner: 0, write: 0, read: 0 };
  mockPermissions.forEach(p => { if (p.role in roleCount) roleCount[p.role as keyof typeof roleCount]++; });

  const permPieData = [
    { name: "Owner", value: roleCount.owner, color: "hsl(217,91%,50%)" },
    { name: "Write", value: roleCount.write, color: "hsl(38,92%,50%)" },
    { name: "Read", value: roleCount.read, color: "hsl(142,71%,40%)" },
  ];

  const externalLinks = mockSubjects.filter(s => s.subject_type === "link");

  const handleExport = () => {
    const headers = ["File", "Drive", "Shared With", "Permissions", "Size"];
    const rows = sharedFiles.map(f => {
      const perms = mockPermissions.filter(p => p.item_id === f.item_id);
      const drive = mockDrives.find(d => d.drive_id === f.drive_id)?.name || "";
      const users = perms.map(p => mockUsers.find(u => u.user_id === p.user_id)?.name || "").join("; ");
      const roles = perms.map(p => p.role).join("; ");
      return [f.name, drive, users, roles, formatSize(f.size)];
    });
    exportToCSV(headers, rows, "shared_files_report.csv");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition"><ArrowLeft className="w-4 h-4" /></button>
            <div>
              <h1 className="text-2xl font-bold"><span className="gradient-text">Shared Files & Permissions</span></h1>
              <p className="text-xs text-muted-foreground">{sharedFiles.length} files shared · {mockPermissions.length} permission entries</p>
            </div>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white text-xs font-medium hover:opacity-90 transition"><Download className="w-3.5 h-3.5" /> Export CSV</button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Shared Files", value: sharedFiles.length, color: "bg-pink-100 text-pink-600", icon: Share2 },
            { label: "Owner Perms", value: roleCount.owner, color: "bg-blue-100 text-blue-600", icon: Shield },
            { label: "Write Perms", value: roleCount.write, color: "bg-amber-100 text-amber-600", icon: Edit3 },
            { label: "External Links", value: externalLinks.length, color: "bg-red-100 text-red-600", icon: Eye },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color} mb-3`}><kpi.icon className="w-5 h-5" /></div>
              <p className="text-xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Permission Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart><Pie data={permPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                {permPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie><RTooltip contentStyle={tooltipStyle} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} /></PieChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="lg:col-span-2 glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Subject Types</h3>
            <div className="grid grid-cols-2 gap-3">
              {mockSubjects.map(s => (
                <div key={s.subject_id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s.subject_type === "user" ? "bg-blue-100 text-blue-600" : s.subject_type === "group" ? "bg-violet-100 text-violet-600" : s.subject_type === "link" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                    {s.subject_type === "user" ? <User className="w-4 h-4" /> : s.subject_type === "group" ? <Users className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  </div>
                  <div><p className="text-xs font-medium">{s.display_name}</p><p className="text-[10px] text-muted-foreground capitalize">{s.subject_type}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Shared Files Detail</h3>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border">
              {["File", "Drive", "Size", "Permissions"].map(h => <th key={h} className="text-left p-2.5 text-muted-foreground font-medium text-[10px] uppercase tracking-wider">{h}</th>)}
            </tr></thead>
            <tbody>
              {sharedFiles.map(f => {
                const perms = mockPermissions.filter(p => p.item_id === f.item_id);
                const drive = mockDrives.find(d => d.drive_id === f.drive_id);
                return (
                  <tr key={f.item_id} className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors">
                    <td className="p-2.5 font-medium">{f.name}</td>
                    <td className="p-2.5">{drive?.name}</td>
                    <td className="p-2.5">{formatSize(f.size)}</td>
                    <td className="p-2.5">
                      <div className="flex gap-1 flex-wrap">
                        {perms.map(p => (
                          <span key={p.permission_id} className={`text-[9px] px-1.5 py-0.5 rounded ${p.role === "owner" ? "bg-blue-100 text-blue-700" : p.role === "write" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {p.role === "write" ? <Edit3 className="w-2 h-2 inline mr-0.5" /> : <Eye className="w-2 h-2 inline mr-0.5" />}
                            {mockUsers.find(u => u.user_id === p.user_id)?.name.split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
};

export default SharedFilesDetail;
