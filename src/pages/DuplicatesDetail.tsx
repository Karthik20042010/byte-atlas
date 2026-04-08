import { motion } from "framer-motion";
import { Copy, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { mockItems, mockDrives, mockFileProperties, mockUsers, formatSize, exportToCSV, tooltipStyle } from "@/lib/mockData";
import PageHeader from "@/components/PageHeader";

const DuplicatesDetail = () => {
  const checksumMap: Record<string, string[]> = {};
  mockFileProperties.forEach(fp => {
    if (!checksumMap[fp.checksum]) checksumMap[fp.checksum] = [];
    checksumMap[fp.checksum].push(fp.item_id);
  });
  const duplicateGroups = Object.entries(checksumMap).filter(([, ids]) => ids.length > 1);
  const totalDupes = duplicateGroups.reduce((a, [, ids]) => a + ids.length, 0);
  const wastedSize = duplicateGroups.reduce((acc, [, ids]) => acc + (ids.length - 1) * (mockItems.find(i => i.item_id === ids[0])?.size || 0), 0);
  const uniqueFiles = mockFileProperties.length - totalDupes + duplicateGroups.length;

  const pieData = [
    { name: "Unique Files", value: uniqueFiles, color: "hsl(142,71%,40%)" },
    { name: "Duplicate Copies", value: totalDupes - duplicateGroups.length, color: "hsl(0,72%,51%)" },
  ];

  const handleExport = () => {
    const headers = ["File Name", "Checksum", "Drives", "Size", "Copies"];
    const rows = duplicateGroups.flatMap(([checksum, ids]) => {
      const items = ids.map(id => mockItems.find(i => i.item_id === id)!);
      return [[ items[0].name, checksum, items.map(i => mockDrives.find(d => d.drive_id === i.drive_id)?.name || "").join(" | "), formatSize(items[0].size), String(ids.length) ]];
    });
    exportToCSV(headers, rows, "duplicates_report.csv");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <PageHeader
          title="Duplicate File Analysis"
          subtitle={`Checksum-based deduplication across ${mockDrives.length} drives`}
          breadcrumbs={[{ label: "Duplicates" }]}
          onExport={handleExport}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Duplicate Groups", value: String(duplicateGroups.length), color: "bg-amber-100 text-amber-600", icon: Copy },
            { label: "Total Copies", value: String(totalDupes), color: "bg-red-100 text-red-600", icon: AlertTriangle },
            { label: "Storage Wasted", value: formatSize(wastedSize), color: "bg-red-100 text-red-600", icon: AlertTriangle },
            { label: "Unique Files", value: String(uniqueFiles), color: "bg-emerald-100 text-emerald-600", icon: Copy },
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
            <h3 className="text-sm font-semibold mb-4">Unique vs Duplicates</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie><RTooltip contentStyle={tooltipStyle} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} /></PieChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="lg:col-span-2 glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Duplicate Groups Detail</h3>
            <div className="space-y-3">
              {duplicateGroups.map(([checksum, ids], idx) => {
                const items = ids.map(id => mockItems.find(i => i.item_id === id)!);
                return (
                  <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + idx * 0.1 }} className="p-4 bg-secondary/50 rounded-lg border-l-4 border-l-amber-400">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">{items[0].name}</p>
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{ids.length} copies · {formatSize(items[0].size)} each</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">Checksum: {checksum}</p>
                    <div className="space-y-1">
                      {items.map(item => {
                        const drive = mockDrives.find(d => d.drive_id === item.drive_id);
                        const creator = mockUsers.find(u => u.user_id === item.created_by);
                        return (
                          <div key={item.item_id} className="flex items-center justify-between px-3 py-1.5 bg-card rounded text-xs">
                            <span className="font-mono text-[10px] text-muted-foreground">{item.path_display}</span>
                            <span className="text-muted-foreground">{drive?.name} · {creator?.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicatesDetail;
