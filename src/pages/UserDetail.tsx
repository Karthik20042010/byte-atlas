import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  User, FileText, Copy, Shield, GitBranch, Cloud, Eye, Edit3, CheckCircle2,
  Download, Share2, Folder, File
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import {
  mockUsers, mockItems, mockDrives, mockFileProperties, mockFileVersions,
  mockPermissions, formatSize, exportToCSV, tooltipStyle, DRIVE_COLORS
} from "@/lib/mockData";

const UserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const user = mockUsers.find(u => u.user_id === userId);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">User not found</p>
          <button onClick={() => navigate("/users")} className="mt-4 text-sm text-[hsl(var(--primary))] hover:underline">Back to Users</button>
        </div>
      </div>
    );
  }

  // User's files
  const userFiles = mockItems.filter(i => i.created_by === user.user_id && i.item_type === "file");
  const userFolders = mockItems.filter(i => i.created_by === user.user_id && i.item_type === "folder");
  const totalStorage = userFiles.reduce((a, f) => a + f.size, 0);

  // Duplicates
  const checksumMap: Record<string, string[]> = {};
  mockFileProperties.forEach(fp => {
    if (!checksumMap[fp.checksum]) checksumMap[fp.checksum] = [];
    checksumMap[fp.checksum].push(fp.item_id);
  });
  const duplicateGroups = Object.entries(checksumMap).filter(([, ids]) => ids.length > 1);
  const userFileIds = new Set(userFiles.map(f => f.item_id));
  const userDuplicates: { file: typeof mockItems[0]; otherDrives: string[]; checksum: string }[] = [];
  duplicateGroups.forEach(([checksum, ids]) => {
    ids.forEach(id => {
      if (userFileIds.has(id)) {
        const file = mockItems.find(i => i.item_id === id)!;
        const otherDrives = ids
          .filter(oid => oid !== id)
          .map(oid => mockDrives.find(d => d.drive_id === mockItems.find(i => i.item_id === oid)?.drive_id)?.name || "Unknown");
        userDuplicates.push({ file, otherDrives, checksum });
      }
    });
  });

  // Versions
  const userVersionFiles = userFiles.filter(f =>
    mockFileVersions.filter(v => v.item_id === f.item_id).length > 1
  );
  const totalVersions = userFiles.reduce((a, f) =>
    a + mockFileVersions.filter(v => v.item_id === f.item_id).length, 0
  );

  // Permissions (files this user owns or has access to)
  const userPermissions = mockPermissions.filter(p => p.user_id === user.user_id);
  const permRoles = { owner: 0, write: 0, read: 0 };
  userPermissions.forEach(p => {
    if (p.role in permRoles) permRoles[p.role as keyof typeof permRoles]++;
  });
  const permPieData = [
    { name: "Owner", value: permRoles.owner, color: "hsl(217,91%,50%)" },
    { name: "Write", value: permRoles.write, color: "hsl(38,92%,50%)" },
    { name: "Read", value: permRoles.read, color: "hsl(142,71%,40%)" },
  ].filter(d => d.value > 0);

  // Files by drive
  const driveBreakdown = mockDrives.map((d, i) => ({
    name: d.name.replace("'s OneDrive", "").replace(" Site", ""),
    files: userFiles.filter(f => f.drive_id === d.drive_id).length,
    storage: userFiles.filter(f => f.drive_id === d.drive_id).reduce((a, f) => a + f.size, 0),
    color: DRIVE_COLORS[i],
  })).filter(d => d.files > 0);

  // File type breakdown
  const typeMap: Record<string, number> = {};
  userFiles.forEach(f => {
    const ext = mockFileProperties.find(fp => fp.item_id === f.item_id)?.extension || "other";
    typeMap[ext] = (typeMap[ext] || 0) + 1;
  });
  const fileTypeData = Object.entries(typeMap).map(([ext, count]) => ({ name: ext, value: count }));

  // Shared files (where other users have permissions on this user's files)
  const sharedByUser = mockPermissions.filter(p => {
    const file = mockItems.find(i => i.item_id === p.item_id);
    return file && file.created_by === user.user_id && p.user_id !== user.user_id;
  });
  const sharedFileIds = new Set(sharedByUser.map(p => p.item_id));

  const handleExport = () => {
    const headers = ["File", "Drive", "Size", "Type", "Created", "Modified", "Path"];
    const rows = userFiles.map(f => [
      f.name,
      mockDrives.find(d => d.drive_id === f.drive_id)?.name || "",
      formatSize(f.size),
      mockFileProperties.find(fp => fp.item_id === f.item_id)?.extension || "",
      f.created_at,
      f.last_modified_at,
      f.path_display,
    ]);
    exportToCSV(headers, rows, `user_${user.name.replace(/\s/g, "_")}_files.csv`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        <PageHeader
          title={user.name}
          subtitle={`${user.email} · ${user.department}`}
          breadcrumbs={[
            { label: "Users", href: "/users" },
            { label: user.name },
          ]}
          onExport={handleExport}
        />

        {/* Profile + KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-5 col-span-2 md:col-span-1 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center mb-2">
              <span className="text-white text-lg font-bold">{user.name.split(" ").map(n => n[0]).join("")}</span>
            </div>
            <Badge variant="outline" className="text-[10px]">{user.department}</Badge>
          </motion.div>
          {[
            { icon: FileText, label: "Files", value: userFiles.length, color: "bg-blue-100 text-blue-600" },
            { icon: Folder, label: "Folders", value: userFolders.length, color: "bg-amber-100 text-amber-600" },
            { icon: Cloud, label: "Storage", value: formatSize(totalStorage), color: "bg-emerald-100 text-emerald-600" },
            { icon: Copy, label: "Duplicates", value: userDuplicates.length, color: "bg-red-100 text-red-600" },
            { icon: GitBranch, label: "Versions", value: totalVersions, color: "bg-violet-100 text-violet-600" },
          ].map((kpi, idx) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + idx * 0.05 }}
              className="glass-card p-4 text-center stat-glow">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Files by Drive */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Files by Drive</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={driveBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(220,9%,46%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                <RTooltip contentStyle={tooltipStyle} />
                <Bar dataKey="files" fill="url(#userBarGrad)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="userBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217,91%,50%)" />
                    <stop offset="100%" stopColor="hsl(262,83%,58%)" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* File Types */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">File Types</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={fileTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}>
                  {fileTypeData.map((_, i) => <Cell key={i} fill={DRIVE_COLORS[i % DRIVE_COLORS.length]} />)}
                </Pie>
                <RTooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Permissions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[hsl(var(--primary))]" /> Permissions
            </h3>
            {permPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={permPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                    {permPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <RTooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-xs">No permissions data</div>
            )}
            <div className="flex justify-center gap-3 mt-2">
              {permPieData.map(p => (
                <div key={p.name} className="text-center">
                  <p className="font-bold text-sm">{p.value}</p>
                  <p className="text-[10px] text-muted-foreground">{p.name}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Duplicates */}
        {userDuplicates.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Copy className="w-4 h-4 text-amber-500" /> Duplicate Files ({userDuplicates.length})
            </h3>
            <div className="space-y-2">
              {userDuplicates.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-3">
                    <File className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-medium">{d.file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{d.file.path_display}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Also on: {d.otherDrives.join(", ")}</span>
                    <Badge variant="outline" className="text-[9px]">{formatSize(d.file.size)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Shared Files */}
        {sharedFileIds.size > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-pink-500" /> Files Shared with Others ({sharedFileIds.size})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border">
                  {["File", "Drive", "Shared With", "Roles"].map(h => (
                    <th key={h} className="text-left p-2.5 text-muted-foreground font-medium text-[10px] uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[...sharedFileIds].map(itemId => {
                    const file = mockItems.find(i => i.item_id === itemId)!;
                    const perms = sharedByUser.filter(p => p.item_id === itemId);
                    return (
                      <tr key={itemId} className="border-b border-border/50 last:border-0">
                        <td className="p-2.5 font-medium">{file.name}</td>
                        <td className="p-2.5 text-muted-foreground">{mockDrives.find(d => d.drive_id === file.drive_id)?.name || ""}</td>
                        <td className="p-2.5">{perms.length} user(s)</td>
                        <td className="p-2.5">
                          <div className="flex gap-1 flex-wrap">
                            {perms.map(p => (
                              <span key={p.permission_id} className={`text-[9px] px-1.5 py-0.5 rounded ${
                                p.role === "write" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                              }`}>
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
            </div>
          </motion.div>
        )}

        {/* Version History */}
        {userVersionFiles.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-violet-500" /> Files with Multiple Versions
            </h3>
            <div className="space-y-3">
              {userVersionFiles.map(f => {
                const versions = mockFileVersions.filter(v => v.item_id === f.item_id).sort((a, b) => a.version_number - b.version_number);
                return (
                  <div key={f.item_id} className="p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-xs">{f.name}</p>
                        <p className="text-[10px] text-muted-foreground">{f.path_display}</p>
                      </div>
                      <Badge className="bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border-0 text-[10px]">{versions.length} versions</Badge>
                    </div>
                    <div className="flex gap-2">
                      {versions.map(v => (
                        <div key={v.version_id} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${v.is_current ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                          v{v.version_number} {v.is_current && <CheckCircle2 className="w-2.5 h-2.5" />}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* All Files Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[hsl(var(--primary))]" /> All Files ({userFiles.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border">
                {["File", "Drive", "Type", "Size", "Created", "Modified"].map(h => (
                  <th key={h} className="text-left p-2.5 text-muted-foreground font-medium text-[10px] uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {userFiles.sort((a, b) => b.size - a.size).map(f => (
                  <tr key={f.item_id} className="border-b border-border/50 last:border-0 hover:bg-secondary/50">
                    <td className="p-2.5 font-medium flex items-center gap-1.5">
                      <File className="w-3 h-3 text-blue-500 shrink-0" /> {f.name}
                    </td>
                    <td className="p-2.5 text-muted-foreground">{mockDrives.find(d => d.drive_id === f.drive_id)?.name || ""}</td>
                    <td className="p-2.5 text-muted-foreground">{mockFileProperties.find(fp => fp.item_id === f.item_id)?.extension || ""}</td>
                    <td className="p-2.5">{formatSize(f.size)}</td>
                    <td className="p-2.5 text-muted-foreground">{f.created_at}</td>
                    <td className="p-2.5 text-muted-foreground">{f.last_modified_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserDetail;
