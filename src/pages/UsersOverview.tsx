import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import {
  Users, User, Copy, FileText, Database, ChevronRight, AlertTriangle, Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import {
  mockUsers, mockItems, mockFileProperties, mockDrives,
  DEPARTMENTS, formatSize, exportToCSV, tooltipStyle, DRIVE_COLORS
} from "@/lib/mockData";

const DEPT_COLORS = ["hsl(217,91%,50%)", "hsl(262,83%,58%)", "hsl(142,71%,40%)", "hsl(38,92%,50%)"];

const UsersOverview = () => {
  const navigate = useNavigate();

  // Build duplicate map
  const checksumMap: Record<string, string[]> = {};
  mockFileProperties.forEach(fp => {
    if (!checksumMap[fp.checksum]) checksumMap[fp.checksum] = [];
    checksumMap[fp.checksum].push(fp.item_id);
  });
  const duplicateGroups = Object.entries(checksumMap).filter(([, ids]) => ids.length > 1);

  // Per-user stats
  const userStats = mockUsers.map(user => {
    const userFiles = mockItems.filter(i => i.created_by === user.user_id && i.item_type === "file");
    const userFileIds = new Set(userFiles.map(f => f.item_id));
    let dupeCount = 0;
    let dupeSize = 0;
    duplicateGroups.forEach(([, ids]) => {
      const userDupes = ids.filter(id => userFileIds.has(id));
      if (userDupes.length > 0) {
        dupeCount += userDupes.length;
        dupeSize += userDupes.length * (mockItems.find(i => i.item_id === ids[0])?.size || 0);
      }
    });
    return {
      ...user,
      fileCount: userFiles.length,
      storageUsed: userFiles.reduce((a, f) => a + f.size, 0),
      dupeCount,
      dupeSize,
    };
  }).sort((a, b) => b.dupeCount - a.dupeCount);

  // Department breakdown
  const deptData = DEPARTMENTS.map((dept, i) => {
    const count = mockUsers.filter(u => u.department === dept).length;
    return { name: dept, value: count, color: DEPT_COLORS[i] };
  });

  // Department duplicate stats for bar chart
  const deptDupeData = DEPARTMENTS.map(dept => {
    const deptUserIds = new Set(mockUsers.filter(u => u.department === dept).map(u => u.user_id));
    const deptFileIds = new Set(mockItems.filter(i => deptUserIds.has(i.created_by) && i.item_type === "file").map(f => f.item_id));
    let dupes = 0;
    duplicateGroups.forEach(([, ids]) => {
      dupes += ids.filter(id => deptFileIds.has(id)).length;
    });
    const totalFiles = mockItems.filter(i => deptUserIds.has(i.created_by) && i.item_type === "file").length;
    return { name: dept, duplicates: dupes, files: totalFiles };
  });

  const topDuplicator = userStats[0];

  const handleExport = () => {
    const headers = ["Name", "Email", "Department", "Files", "Storage", "Duplicates", "Duplicate Storage"];
    const rows = userStats.map(u => [
      u.name, u.email, u.department, String(u.fileCount), formatSize(u.storageUsed),
      String(u.dupeCount), formatSize(u.dupeSize),
    ]);
    exportToCSV(headers, rows, "users_analysis.csv");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        <PageHeader
          title="User Analytics"
          subtitle={`${mockUsers.length} users across ${DEPARTMENTS.length} departments`}
          breadcrumbs={[{ label: "Users" }]}
          onExport={handleExport}
        />

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-[hsl(var(--primary))]" />
            <p className="text-2xl font-bold">{mockUsers.length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5 text-center">
            <Database className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-bold">{DEPARTMENTS.length}</p>
            <p className="text-xs text-muted-foreground">Departments</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 text-center">
            <Copy className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{userStats.reduce((a, u) => a + u.dupeCount, 0)}</p>
            <p className="text-xs text-muted-foreground">Total User Duplicates</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-[10px] text-muted-foreground">Highest Duplicates</span>
            </div>
            <p className="font-bold text-sm">{topDuplicator?.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[9px]">{topDuplicator?.department}</Badge>
              <span className="text-xs text-amber-600 font-medium">{topDuplicator?.dupeCount} dupes</span>
            </div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[hsl(var(--primary))]" /> Users by Department
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deptData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {deptData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <RTooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Copy className="w-4 h-4 text-amber-500" /> Duplicates by Department
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptDupeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                <RTooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="files" name="Total Files" fill="hsl(217,91%,50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="duplicates" name="Duplicates" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Department Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Department Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {DEPARTMENTS.map((dept, idx) => {
              const deptUsers = mockUsers.filter(u => u.department === dept);
              const deptFileCount = mockItems.filter(i => deptUsers.some(u => u.user_id === i.created_by) && i.item_type === "file").length;
              const deptStorage = mockItems.filter(i => deptUsers.some(u => u.user_id === i.created_by) && i.item_type === "file").reduce((a, f) => a + f.size, 0);
              return (
                <div key={dept} className="p-4 bg-secondary/50 rounded-lg border-l-4" style={{ borderLeftColor: DEPT_COLORS[idx] }}>
                  <p className="font-semibold text-sm">{dept}</p>
                  <div className="grid grid-cols-3 gap-1 mt-2">
                    <div><p className="text-lg font-bold">{deptUsers.length}</p><p className="text-[10px] text-muted-foreground">Users</p></div>
                    <div><p className="text-lg font-bold">{deptFileCount}</p><p className="text-[10px] text-muted-foreground">Files</p></div>
                    <div><p className="text-lg font-bold text-xs mt-1">{formatSize(deptStorage)}</p><p className="text-[10px] text-muted-foreground">Storage</p></div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {deptUsers.map(u => (
                      <div key={u.user_id} className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <User className="w-2.5 h-2.5" /> {u.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* All Users Table — clickable rows */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-violet-500" /> All Users — Click to Analyze
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["User", "Email", "Department", "Files", "Storage", "Duplicates", "Dupe Storage", ""].map(h => (
                    <th key={h} className="text-left p-2.5 text-muted-foreground font-medium text-[10px] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userStats.map((u, idx) => (
                  <motion.tr
                    key={u.user_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.03 }}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/users/${u.user_id}`)}
                  >
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center shrink-0">
                          <span className="text-white text-[9px] font-bold">{u.name.split(" ").map(n => n[0]).join("")}</span>
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-muted-foreground">{u.email}</td>
                    <td className="p-2.5"><Badge variant="outline" className="text-[9px]">{u.department}</Badge></td>
                    <td className="p-2.5 font-medium">{u.fileCount}</td>
                    <td className="p-2.5">{formatSize(u.storageUsed)}</td>
                    <td className="p-2.5">
                      {u.dupeCount > 0 ? (
                        <span className="text-amber-600 font-bold">{u.dupeCount}</span>
                      ) : (
                        <span className="text-emerald-600">0</span>
                      )}
                    </td>
                    <td className="p-2.5 text-muted-foreground">{u.dupeCount > 0 ? formatSize(u.dupeSize) : "—"}</td>
                    <td className="p-2.5">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UsersOverview;
