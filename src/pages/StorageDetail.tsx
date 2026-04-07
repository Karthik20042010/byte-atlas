import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Database, Download, TrendingUp, HardDrive } from "lucide-react";
import { PieChart, Pie, Cell, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { mockItems, mockDrives, mockUsers, formatSize, exportToCSV, STORAGE_GROWTH, CATEGORY_DATA, DRIVE_COLORS, tooltipStyle } from "@/lib/mockData";

const StorageDetail = () => {
  const navigate = useNavigate();
  const totalSize = mockItems.filter(i => i.item_type === "file").reduce((a, i) => a + i.size, 0);

  const driveStorageData = mockDrives.map(d => {
    const size = mockItems.filter(i => i.drive_id === d.drive_id && i.item_type === "file").reduce((a, i) => a + i.size, 0);
    return { name: d.name.replace("'s OneDrive", ""), value: Math.round(size / 1048576), fullName: d.name };
  });

  const filesByType = mockItems.filter(i => i.item_type === "file").reduce((acc, item) => {
    const ext = item.name.split(".").pop() || "other";
    acc[ext] = (acc[ext] || 0) + item.size;
    return acc;
  }, {} as Record<string, number>);
  const typeData = Object.entries(filesByType).map(([name, size]) => ({ name: `.${name}`, size: Math.round(size / 1048576) })).sort((a, b) => b.size - a.size);

  const userStorageData = mockUsers.map(u => ({
    name: u.name.split(" ")[0],
    storage: Math.round(mockItems.filter(i => i.created_by === u.user_id && i.item_type === "file").reduce((a, i) => a + i.size, 0) / 1048576),
  }));

  const handleExport = () => {
    const headers = ["Drive", "Files", "Storage (MB)"];
    const rows = driveStorageData.map(d => [d.fullName || d.name, String(mockItems.filter(i => i.drive_id === mockDrives.find(dr => dr.name.includes(d.name))?.drive_id).length), String(d.value)]);
    exportToCSV(headers, rows, "storage_report.csv");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold"><span className="gradient-text">Total Storage Analysis</span></h1>
              <p className="text-xs text-muted-foreground">Detailed breakdown of {formatSize(totalSize)} across {mockDrives.length} drives</p>
            </div>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white text-xs font-medium hover:opacity-90 transition">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Storage", value: formatSize(totalSize), icon: Database, color: "bg-emerald-100 text-emerald-600" },
            { label: "Avg per Drive", value: formatSize(totalSize / mockDrives.length), icon: HardDrive, color: "bg-blue-100 text-blue-600" },
            { label: "Largest Drive", value: driveStorageData.sort((a, b) => b.value - a.value)[0]?.name, icon: TrendingUp, color: "bg-violet-100 text-violet-600" },
            { label: "File Types", value: String(Object.keys(filesByType).length), icon: Database, color: "bg-amber-100 text-amber-600" },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color} mb-3`}><kpi.icon className="w-5 h-5" /></div>
              <p className="text-xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Storage by Drive</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart><Pie data={driveStorageData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                {driveStorageData.map((_, i) => <Cell key={i} fill={DRIVE_COLORS[i % DRIVE_COLORS.length]} />)}
              </Pie><RTooltip contentStyle={tooltipStyle} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} /></PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Storage Growth Trend (TB)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={STORAGE_GROWTH}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                <RTooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="storage" stroke="hsl(217,91%,50%)" strokeWidth={2} dot={{ fill: "hsl(217,91%,50%)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Storage by File Type (MB)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} width={50} />
                <RTooltip contentStyle={tooltipStyle} />
                <Bar dataKey="size" radius={[0, 4, 4, 0]} fill="url(#typeGrad)" />
                <defs><linearGradient id="typeGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="hsl(217,91%,50%)" /><stop offset="100%" stopColor="hsl(262,83%,58%)" /></linearGradient></defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Storage by User (MB)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userStorageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                <RTooltip contentStyle={tooltipStyle} />
                <Bar dataKey="storage" radius={[4, 4, 0, 0]} fill="hsl(142,71%,40%)" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">File Category Distribution (TB)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} width={100} />
              <RTooltip contentStyle={tooltipStyle} />
              <Bar dataKey="size" radius={[0, 4, 4, 0]} fill="url(#catGrad)" />
              <defs><linearGradient id="catGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="hsl(38,92%,50%)" /><stop offset="100%" stopColor="hsl(0,72%,51%)" /></linearGradient></defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default StorageDetail;
