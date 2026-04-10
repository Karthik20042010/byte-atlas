import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend
} from "recharts";
import {
  Users, User, FileText, Copy, Database, GitBranch, Share2,
  ChevronDown, ArrowLeftRight, Crown, AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import {
  mockUsers, mockItems, mockFileProperties, mockFileVersions,
  mockPermissions, mockDrives, formatSize, tooltipStyle, DRIVE_COLORS
} from "@/lib/mockData";

// Build user stats
function getUserStats(userId: string) {
  const user = mockUsers.find(u => u.user_id === userId)!;
  const userFiles = mockItems.filter(i => i.created_by === userId && i.item_type === "file");
  const userFolders = mockItems.filter(i => i.created_by === userId && i.item_type === "folder");
  const totalStorage = userFiles.reduce((a, f) => a + f.size, 0);

  const checksumMap: Record<string, string[]> = {};
  mockFileProperties.forEach(fp => {
    if (!checksumMap[fp.checksum]) checksumMap[fp.checksum] = [];
    checksumMap[fp.checksum].push(fp.item_id);
  });
  const duplicateGroups = Object.entries(checksumMap).filter(([, ids]) => ids.length > 1);
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

  const userVersions = mockFileVersions.filter(v => userFileIds.has(v.item_id));
  const userShared = mockPermissions.filter(p => userFileIds.has(p.item_id) && p.role !== "owner");

  // Drive distribution
  const driveMap: Record<string, number> = {};
  userFiles.forEach(f => {
    const drive = mockDrives.find(d => d.drive_id === f.drive_id);
    const name = drive?.name?.replace("'s OneDrive", "").replace(" Site", "") || f.drive_id;
    driveMap[name] = (driveMap[name] || 0) + 1;
  });
  const driveData = Object.entries(driveMap).map(([name, count]) => ({ name, count }));

  // File type distribution
  const extMap: Record<string, number> = {};
  userFiles.forEach(f => {
    const fp = mockFileProperties.find(p => p.item_id === f.item_id);
    const ext = fp?.extension || "unknown";
    extMap[ext] = (extMap[ext] || 0) + 1;
  });
  const fileTypeData = Object.entries(extMap).map(([ext, count]) => ({ name: ext, count }));

  return {
    user,
    fileCount: userFiles.length,
    folderCount: userFolders.length,
    totalStorage,
    dupeCount,
    dupeSize,
    versionCount: userVersions.length,
    sharedCount: userShared.length,
    driveData,
    fileTypeData,
  };
}

function UserSelector({ selectedId, onSelect, excludeId }: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  excludeId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const available = mockUsers.filter(u => u.user_id !== excludeId);
  const selected = selectedId ? mockUsers.find(u => u.user_id === selectedId) : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-secondary border border-border hover:border-[hsl(var(--primary))]/50 transition-colors text-left"
      >
        {selected ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">
                {selected.name.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{selected.name}</p>
              <p className="text-[10px] text-muted-foreground">{selected.department}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Select a user…</span>
        )}
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {available.map(u => (
            <button
              key={u.user_id}
              onClick={() => { onSelect(u.user_id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-secondary/80 transition-colors text-left"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">
                  {u.name.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium">{u.name}</p>
                <p className="text-[10px] text-muted-foreground">{u.department}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBar({ label, valueA, valueB, nameA, nameB, format }: {
  label: string; valueA: number; valueB: number; nameA: string; nameB: string; format?: (v: number) => string;
}) {
  const max = Math.max(valueA, valueB, 1);
  const fmt = format || ((v: number) => String(v));
  const winner = valueA > valueB ? "A" : valueB > valueA ? "B" : "tie";

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span className={`text-sm font-bold ${winner === "A" ? "text-[hsl(var(--primary))]" : ""}`}>{fmt(valueA)}</span>
            {winner === "A" && <Crown className="w-3 h-3 text-amber-500" />}
          </div>
          <div className="h-2 rounded-full bg-secondary mt-1 overflow-hidden flex justify-end">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(valueA / max) * 100}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-[hsl(var(--primary))]"
            />
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">vs</span>
        <div>
          <div className="flex items-center gap-2">
            {winner === "B" && <Crown className="w-3 h-3 text-amber-500" />}
            <span className={`text-sm font-bold ${winner === "B" ? "text-[hsl(var(--accent))]" : ""}`}>{fmt(valueB)}</span>
          </div>
          <div className="h-2 rounded-full bg-secondary mt-1 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(valueB / max) * 100}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-[hsl(var(--accent))]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const UserCompare = () => {
  const navigate = useNavigate();
  const [userAId, setUserAId] = useState<string | null>(mockUsers[0]?.user_id || null);
  const [userBId, setUserBId] = useState<string | null>(mockUsers[1]?.user_id || null);

  const statsA = userAId ? getUserStats(userAId) : null;
  const statsB = userBId ? getUserStats(userBId) : null;

  // Radar chart data
  const radarData = statsA && statsB ? [
    { metric: "Files", A: statsA.fileCount, B: statsB.fileCount },
    { metric: "Folders", A: statsA.folderCount, B: statsB.folderCount },
    { metric: "Duplicates", A: statsA.dupeCount, B: statsB.dupeCount },
    { metric: "Versions", A: statsA.versionCount, B: statsB.versionCount },
    { metric: "Shared", A: statsA.sharedCount, B: statsB.sharedCount },
  ] : [];

  // Comparative bar chart
  const compareBarData = statsA && statsB ? [
    { metric: "Files", [statsA.user.name]: statsA.fileCount, [statsB.user.name]: statsB.fileCount },
    { metric: "Duplicates", [statsA.user.name]: statsA.dupeCount, [statsB.user.name]: statsB.dupeCount },
    { metric: "Versions", [statsA.user.name]: statsA.versionCount, [statsB.user.name]: statsB.versionCount },
    { metric: "Shared", [statsA.user.name]: statsA.sharedCount, [statsB.user.name]: statsB.sharedCount },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        <PageHeader
          title="Compare Users"
          subtitle="Side-by-side analysis of storage, duplicates, and activity"
          breadcrumbs={[{ label: "Users", href: "/users" }, { label: "Compare" }]}
        />

        {/* User Selectors */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">User A</p>
            <UserSelector selectedId={userAId} onSelect={setUserAId} excludeId={userBId} />
          </motion.div>
          <div className="flex items-center justify-center pt-6">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">User B</p>
            <UserSelector selectedId={userBId} onSelect={setUserBId} excludeId={userAId} />
          </motion.div>
        </div>

        {statsA && statsB ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* KPI Comparison Bars */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold mb-5 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-[hsl(var(--primary))]" /> Head-to-Head Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 mb-4">
                    <p className="text-right text-xs font-semibold text-[hsl(var(--primary))]">{statsA.user.name}</p>
                    <span />
                    <p className="text-xs font-semibold text-[hsl(var(--accent))]">{statsB.user.name}</p>
                  </div>
                  <StatBar label="Total Files" valueA={statsA.fileCount} valueB={statsB.fileCount} nameA={statsA.user.name} nameB={statsB.user.name} />
                  <StatBar label="Storage Used" valueA={statsA.totalStorage} valueB={statsB.totalStorage} nameA={statsA.user.name} nameB={statsB.user.name} format={formatSize} />
                  <StatBar label="Duplicates" valueA={statsA.dupeCount} valueB={statsB.dupeCount} nameA={statsA.user.name} nameB={statsB.user.name} />
                  <StatBar label="Wasted Storage" valueA={statsA.dupeSize} valueB={statsB.dupeSize} nameA={statsA.user.name} nameB={statsB.user.name} format={formatSize} />
                  <StatBar label="Versions" valueA={statsA.versionCount} valueB={statsB.versionCount} nameA={statsA.user.name} nameB={statsB.user.name} />
                  <StatBar label="Shared Files" valueA={statsA.sharedCount} valueB={statsB.sharedCount} nameA={statsA.user.name} nameB={statsB.user.name} />
                </div>

                {/* Radar Chart */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-3">Activity Profile</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(220,13%,91%)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                      <PolarRadiusAxis tick={{ fontSize: 8, fill: "hsl(220,9%,46%)" }} />
                      <Radar name={statsA.user.name} dataKey="A" stroke="hsl(217,91%,50%)" fill="hsl(217,91%,50%)" fillOpacity={0.2} />
                      <Radar name={statsB.user.name} dataKey="B" stroke="hsl(262,83%,58%)" fill="hsl(262,83%,58%)" fillOpacity={0.2} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Comparative Bar Chart */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" /> Metric Comparison
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={compareBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                  <RTooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey={statsA.user.name} fill="hsl(217,91%,50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={statsB.user.name} fill="hsl(262,83%,58%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Drive & File Type Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* User A drives */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-[hsl(var(--primary))]" /> {statsA.user.name} — Drives
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={statsA.driveData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
                    <RTooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="hsl(217,91%,50%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* User B drives */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-[hsl(var(--accent))]" /> {statsB.user.name} — Drives
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={statsB.driveData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
                    <RTooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="hsl(262,83%,58%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* File Type Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-3">{statsA.user.name} — File Types</h3>
                <div className="space-y-2">
                  {statsA.fileTypeData.map(ft => (
                    <div key={ft.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs">.{ft.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${(ft.count / statsA.fileCount) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-medium w-6 text-right">{ft.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-3">{statsB.user.name} — File Types</h3>
                <div className="space-y-2">
                  {statsB.fileTypeData.map(ft => (
                    <div key={ft.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs">.{ft.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-[hsl(var(--accent))]" style={{ width: `${(ft.count / statsB.fileCount) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-medium w-6 text-right">{ft.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Key Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Storage Leader</p>
                  <p className="text-sm font-bold">
                    {statsA.totalStorage > statsB.totalStorage ? statsA.user.name : statsB.user.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Using {formatSize(Math.abs(statsA.totalStorage - statsB.totalStorage))} more storage
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Most Duplicates</p>
                  <p className="text-sm font-bold">
                    {statsA.dupeCount > statsB.dupeCount ? statsA.user.name : statsB.user.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {Math.abs(statsA.dupeCount - statsB.dupeCount)} more duplicate files
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Most Collaborative</p>
                  <p className="text-sm font-bold">
                    {statsA.sharedCount > statsB.sharedCount ? statsA.user.name : statsB.user.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {Math.abs(statsA.sharedCount - statsB.sharedCount)} more shared files
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="flex gap-3">
              <button onClick={() => navigate(`/users/${userAId}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-xs font-medium hover:bg-[hsl(var(--primary))]/20 transition">
                <User className="w-3.5 h-3.5" /> View {statsA.user.name}'s Full Profile
              </button>
              <button onClick={() => navigate(`/users/${userBId}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] text-xs font-medium hover:bg-[hsl(var(--accent))]/20 transition">
                <User className="w-3.5 h-3.5" /> View {statsB.user.name}'s Full Profile
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Select two users above to compare their analytics</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCompare;
