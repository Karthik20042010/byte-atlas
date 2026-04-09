import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveData } from "@/hooks/useLiveData";
import TickerNumber from "@/components/TickerNumber";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  LineChart, Line, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";
import {
  Search, Send, Bot, User, HardDrive, Cloud, Database, Archive,
  FileText, AlertTriangle, TrendingUp, Copy, Layers, ShieldAlert,
  ChevronRight, ChevronDown, Filter, X, Sparkles, ArrowUpRight, BarChart3,
  Users, RefreshCw, Shield, GitBranch, FolderOpen, CheckCircle2,
  XCircle, Clock, Share2, Eye, Edit3, Folder, File, Download, Monitor, Terminal
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  mockUsers, mockDrives, mockItems, mockFileProperties, mockFileVersions,
  mockPermissions, mockSyncRuns, mockSubjects, STORAGE_GROWTH, CATEGORY_DATA,
  formatSize, exportToCSV, DRIVE_COLORS, tooltipStyle
} from "@/lib/mockData";

// ── Agent Response Logic ──
type ChatMsg = { role: "user" | "agent"; content: string; table?: { headers: string[]; rows: string[][] } };

function getAgentResponse(q: string): ChatMsg {
  const lq = q.toLowerCase();
  if (lq.includes("duplicate")) {
    const checksumMap: Record<string, string[]> = {};
    mockFileProperties.forEach(fp => {
      if (!checksumMap[fp.checksum]) checksumMap[fp.checksum] = [];
      checksumMap[fp.checksum].push(fp.item_id);
    });
    const dupes = Object.entries(checksumMap).filter(([, ids]) => ids.length > 1);
    const rows = dupes.map(([checksum, ids]) => {
      const items = ids.map(id => mockItems.find(i => i.item_id === id)!);
      const drives = items.map(i => mockDrives.find(d => d.drive_id === i.drive_id)?.name || i.drive_id);
      return [items[0].name, drives.join(", "), formatSize(items[0].size), checksum.slice(0, 16) + "…"];
    });
    return {
      role: "agent",
      content: `Found **${dupes.length} duplicate group(s)** by checksum matching across drives. Storage wasted: **${formatSize(dupes.reduce((acc, [, ids]) => acc + (ids.length - 1) * (mockItems.find(i => i.item_id === ids[0])?.size || 0), 0))}**.`,
      table: { headers: ["File", "Drives", "Size", "Checksum"], rows },
    };
  }
  if (lq.includes("drive") || lq.includes("overview")) {
    return {
      role: "agent",
      content: `You have **${mockDrives.length} drives** configured:\n\n${mockDrives.map(d => {
        const fileCount = mockItems.filter(i => i.drive_id === d.drive_id && i.item_type === "file").length;
        const totalSize = mockItems.filter(i => i.drive_id === d.drive_id && i.item_type === "file").reduce((a, i) => a + i.size, 0);
        const sync = mockSyncRuns.find(s => s.drive_id === d.drive_id);
        return `• **${d.name}** (${d.drive_type}) — ${fileCount} files, ${formatSize(totalSize)}, sync: ${sync?.status || "unknown"}`;
      }).join("\n")}`,
    };
  }
  if (lq.includes("version")) {
    const versionCounts: Record<string, number> = {};
    mockFileVersions.forEach(v => { versionCounts[v.item_id] = (versionCounts[v.item_id] || 0) + 1; });
    const multiVersion = Object.entries(versionCounts).filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);
    return {
      role: "agent",
      content: `**${multiVersion.length} files** have multiple versions:`,
      table: {
        headers: ["File", "Drive", "Versions", "Current Size"],
        rows: multiVersion.map(([itemId, count]) => {
          const item = mockItems.find(i => i.item_id === itemId)!;
          const drive = mockDrives.find(d => d.drive_id === item.drive_id)?.name || "";
          return [item.name, drive, String(count), formatSize(item.size)];
        }),
      },
    };
  }
  if (lq.includes("permission") || lq.includes("sharing") || lq.includes("shared")) {
    const shared = new Set(mockPermissions.filter(p => p.role !== "owner").map(p => p.item_id));
    const roleCount = { owner: 0, write: 0, read: 0 };
    mockPermissions.forEach(p => { if (p.role in roleCount) roleCount[p.role as keyof typeof roleCount]++; });
    return {
      role: "agent",
      content: `**Permissions Summary:**\n\n• **${shared.size} files** are shared with others\n• **${roleCount.owner}** owner permissions\n• **${roleCount.write}** write permissions\n• **${roleCount.read}** read-only permissions\n• **${mockSubjects.filter(s => s.subject_type === "link").length}** external sharing link(s) active`,
    };
  }
  if (lq.includes("sync")) {
    return {
      role: "agent",
      content: "**Sync Status across all drives:**",
      table: {
        headers: ["Drive", "Status", "Started", "Items Synced"],
        rows: mockSyncRuns.map(s => {
          const drive = mockDrives.find(d => d.drive_id === s.drive_id)?.name || s.drive_id;
          return [drive, s.status, new Date(s.run_started_at).toLocaleTimeString(), String(s.stats_json.items_synced)];
        }),
      },
    };
  }
  if (lq.includes("largest") || lq.includes("large")) {
    const sorted = [...mockItems].filter(i => i.item_type === "file").sort((a, b) => b.size - a.size).slice(0, 5);
    return {
      role: "agent",
      content: "Here are the **largest files** across all drives:",
      table: {
        headers: ["File", "Drive", "Size", "Modified"],
        rows: sorted.map(f => {
          const drive = mockDrives.find(d => d.drive_id === f.drive_id)?.name || "";
          return [f.name, drive, formatSize(f.size), f.last_modified_at];
        }),
      },
    };
  }
  if (lq.includes("invoice")) {
    const invoices = mockItems.filter(i => i.name.toLowerCase().includes("invoice"));
    return {
      role: "agent",
      content: `Found **${invoices.length} invoice files** across your OneDrive ecosystem:`,
      table: {
        headers: ["File", "Drive", "Size", "Path"],
        rows: invoices.map(f => [f.name, mockDrives.find(d => d.drive_id === f.drive_id)?.name || "", formatSize(f.size), f.path_display]),
      },
    };
  }
  return {
    role: "agent",
    content: `I analyzed your OneDrive ecosystem: **${mockDrives.length} drives**, **${mockItems.filter(i => i.item_type === "file").length} files**, **${mockFileVersions.length} file versions**, **${mockPermissions.length} permissions**. Try asking about drives, duplicates, versions, permissions, or sync status.`,
  };
}

// ── Helpers ──
// AnimatedCounter replaced by TickerNumber component

const driveTypeColors: Record<string, string> = {
  personal: "bg-blue-100 text-blue-700",
  documentLibrary: "bg-emerald-100 text-emerald-700",
};

function DriveBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${driveTypeColors[type] || "bg-muted text-muted-foreground"}`}>
      {type === "personal" ? <User className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
      {type === "personal" ? "Personal" : "Shared"}
    </span>
  );
}

function SyncStatusIcon({ status }: { status: string }) {
  if (status === "succeeded") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "running") return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
  if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-muted-foreground" />;
}

function KPICard({ icon: Icon, label, value, suffix, prefix, color, delay, href }: {
  icon: typeof Cloud; label: string; value: number; suffix?: string; prefix?: string; color: string; delay: number; href?: string;
}) {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
      className={`glass-card p-5 stat-glow group hover:scale-[1.02] transition-transform duration-300 ${href ? "cursor-pointer" : ""}`}
      onClick={() => href && navigate(href)}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors" />
      </div>
      <p className="text-2xl font-bold tracking-tight">
        <TickerNumber value={value} suffix={suffix} prefix={prefix} showDelta />
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

// ── File Explorer Tree ──
type TreeNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  children: TreeNode[];
  item?: typeof mockItems[0];
};

function buildTree(driveId: string): TreeNode[] {
  const driveItems = mockItems.filter(i => i.drive_id === driveId);
  const rootItems = driveItems.filter(i => i.parent_id === null);

  function buildChildren(parentId: string): TreeNode[] {
    return driveItems
      .filter(i => i.parent_id === parentId)
      .map(item => ({
        id: item.item_id,
        name: item.name,
        type: item.item_type as "folder" | "file",
        children: item.item_type === "folder" ? buildChildren(item.item_id) : [],
        item,
      }))
      .sort((a, b) => {
        if (a.type === "folder" && b.type === "file") return -1;
        if (a.type === "file" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name);
      });
  }

  return rootItems.map(item => ({
    id: item.item_id,
    name: item.name,
    type: item.item_type as "folder" | "file",
    children: item.item_type === "folder" ? buildChildren(item.item_id) : [],
    item,
  })).sort((a, b) => {
    if (a.type === "folder" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "folder") return 1;
    return a.name.localeCompare(b.name);
  });
}

function TreeItem({ node, depth = 0, selectedId, onSelect }: { node: TreeNode; depth?: number; selectedId: string | null; onSelect: (node: TreeNode) => void }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isFolder = node.type === "folder";
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-xs transition-colors ${selectedId === node.id ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]" : "hover:bg-secondary"}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => { if (isFolder && hasChildren) setExpanded(!expanded); onSelect(node); }}
      >
        {isFolder && hasChildren ? (
          <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
        ) : (
          <span className="w-3" />
        )}
        {isFolder ? <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" /> : <File className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
        <span className="truncate">{node.name}</span>
      </div>
      {isFolder && expanded && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            {node.children.map(child => (
              <TreeItem key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

const ALERTS = [
  { type: "warning", icon: Copy, text: "Duplicate files detected: invoice_2024_Q1.pdf exists on 2 drives (drv-001, drv-003) with matching checksum", time: "2h ago" },
  { type: "danger", icon: XCircle, text: "Sync failed on Legal & Compliance drive — delta token expired", time: "5h ago" },
  { type: "info", icon: FileText, text: "4 files with 3+ versions detected — consider version cleanup policy", time: "1d ago" },
  { type: "warning", icon: Share2, text: "1 external sharing link active — review permissions", time: "1d ago" },
];

const SUGGESTED_PROMPTS = [
  "Show drives overview",
  "Find duplicate files",
  "Files with most versions",
  "Shared files analysis",
  "Sync status",
  "Permission breakdown",
];

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════
const Index = () => {
  const navigate = useNavigate();
  const { liveSync, liveFileCount, liveTotalSize, liveItemsSynced } = useLiveData(3000);
  const [darkMode, setDarkMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: "agent", content: "Hello! I'm your **OneDrive Intelligence Agent**. Ask me about drives, file versions, permissions, sync status, or duplicates across your OneDrive ecosystem." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [driveFilter, setDriveFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<"overview" | "drives" | "versions" | "permissions" | "sync" | "explorer">("overview");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [explorerDrive, setExplorerDrive] = useState(mockDrives[0].drive_id);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const termTooltipStyle = darkMode
    ? { background: "hsl(0,0%,4%)", border: "1px solid hsl(120,30%,15%)", borderRadius: 8, fontSize: 11, color: "hsl(120,100%,50%)" }
    : tooltipStyle;

  useEffect(() => { setLastRefresh(new Date()); }, [liveFileCount]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMsg = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setTimeout(() => { setChatMessages(prev => [...prev, getAgentResponse(chatInput)]); }, 600);
  };

  const totalSize = mockItems.filter(i => i.item_type === "file").reduce((a, i) => a + i.size, 0);
  const totalFiles = mockItems.filter(i => i.item_type === "file").length;

  const checksumMap: Record<string, string[]> = {};
  mockFileProperties.forEach(fp => {
    if (!checksumMap[fp.checksum]) checksumMap[fp.checksum] = [];
    checksumMap[fp.checksum].push(fp.item_id);
  });
  const duplicateGroups = Object.entries(checksumMap).filter(([, ids]) => ids.length > 1);
  const duplicateFileCount = duplicateGroups.reduce((a, [, ids]) => a + ids.length, 0);
  const wastedSize = duplicateGroups.reduce((acc, [, ids]) => acc + (ids.length - 1) * (mockItems.find(i => i.item_id === ids[0])?.size || 0), 0);

  const sharedItems = new Set(mockPermissions.filter(p => p.role !== "owner").map(p => p.item_id));

  const driveStorageData = mockDrives.map(d => {
    const size = mockItems.filter(i => i.drive_id === d.drive_id && i.item_type === "file").reduce((a, i) => a + i.size, 0);
    return { name: d.name.replace("'s OneDrive", "").replace(" Site", ""), value: Math.round(size / 1048576), fullName: d.name };
  });

  const filteredFiles = mockItems.filter(f => {
    if (f.item_type !== "file") return false;
    const matchSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.path_display.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDrive = driveFilter === "All" || f.drive_id === driveFilter;
    return matchSearch && matchDrive;
  });

  const versionCounts: Record<string, number> = {};
  mockFileVersions.forEach(v => { versionCounts[v.item_id] = (versionCounts[v.item_id] || 0) + 1; });
  const multiVersionFiles = Object.entries(versionCounts).filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);

  const roleCount = { owner: 0, write: 0, read: 0 };
  mockPermissions.forEach(p => { if (p.role in roleCount) roleCount[p.role as keyof typeof roleCount]++; });
  const permissionPieData = [
    { name: "Owner", value: roleCount.owner, color: "hsl(217,91%,50%)" },
    { name: "Write", value: roleCount.write, color: "hsl(38,92%,50%)" },
    { name: "Read", value: roleCount.read, color: "hsl(142,71%,40%)" },
  ];

  const userActivity = mockUsers.map(u => {
    const fileCount = mockItems.filter(i => i.created_by === u.user_id && i.item_type === "file").length;
    const storageUsed = mockItems.filter(i => i.created_by === u.user_id && i.item_type === "file").reduce((a, i) => a + i.size, 0);
    return { ...u, fileCount, storageUsed };
  }).sort((a, b) => b.storageUsed - a.storageUsed);

  const alertColors: Record<string, string> = {
    warning: "border-l-[hsl(var(--warning))] bg-amber-50",
    danger: "border-l-destructive bg-red-50",
    info: "border-l-[hsl(var(--primary))] bg-blue-50",
  };

  // File explorer tree
  const explorerTree = useMemo(() => buildTree(explorerDrive), [explorerDrive]);

  const handleExportFiles = () => {
    const headers = ["File Name", "Drive", "Type", "Size", "Created By", "Path"];
    const rows = filteredFiles.map(f => [
      f.name,
      mockDrives.find(d => d.drive_id === f.drive_id)?.name || "",
      mockFileProperties.find(fp => fp.item_id === f.item_id)?.extension || "",
      formatSize(f.size),
      mockUsers.find(u => u.user_id === f.created_by)?.name || "",
      f.path_display,
    ]);
    exportToCSV(headers, rows, "file_search_export.csv");
  };

  return (
    <div className={`flex h-screen overflow-hidden bg-background ${darkMode ? "terminal-dark" : ""}`}>
      {/* ── LEFT: Chat Panel ── */}
      <motion.div initial={{ x: -320 }} animate={{ x: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-[340px] min-w-[340px] flex flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm">{darkMode ? <span className="terminal-cursor">OneDrive Scanner</span> : "OneDrive Intelligence Agent"}</h2>
              <p className="text-[10px] text-muted-foreground">{darkMode ? "$ scanning drives..." : "Drives · Versions · Permissions · Sync"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {SUGGESTED_PROMPTS.map(p => (
              <button key={p} onClick={() => setChatInput(p)}
                className="text-[10px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-[hsl(var(--primary))]/10 hover:text-[hsl(var(--primary))] transition-colors">
                {p}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 scrollbar-thin">
          <div className="space-y-3">
            <AnimatePresence>
              {chatMessages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="flex gap-2 max-w-[90%]">
                    {msg.role === "agent" && (
                      <div className="w-6 h-6 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center mt-1 shrink-0">
                        <Bot className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
                      </div>
                    )}
                    <div>
                      <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-agent"}>
                        <p className="text-xs leading-relaxed whitespace-pre-line">
                          {msg.content.split("**").map((part, idx) => idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part)}
                        </p>
                      </div>
                      {msg.table && (
                        <div className="mt-2 glass-card overflow-hidden">
                          <table className="w-full text-[10px]">
                            <thead><tr className="border-b border-border bg-secondary/50">
                              {msg.table.headers.map(h => <th key={h} className="text-left p-2 text-muted-foreground font-medium">{h}</th>)}
                            </tr></thead>
                            <tbody>
                              {msg.table.rows.map((row, ri) => (
                                <tr key={ri} className="border-b border-border/50 last:border-0">
                                  {row.map((cell, ci) => <td key={ci} className="p-2">{cell}</td>)}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-[hsl(var(--accent))]/10 flex items-center justify-center mt-1 shrink-0">
                        <User className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your OneDrive files..."
              className="text-xs bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-[hsl(var(--primary))]" />
            <button onClick={sendMessage}
              className="w-9 h-9 rounded-lg bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center hover:opacity-90 transition shrink-0">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── RIGHT: Dashboard ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="gradient-text">OneDrive File Intelligence</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Real-time analytics across {mockDrives.length} drives · {mockUsers.length} users</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Terminal Dark Mode Toggle */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                <Switch checked={darkMode} onCheckedChange={setDarkMode} className="scale-75" />
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                <span className={`text-[10px] font-medium ${darkMode ? "terminal-cursor" : "text-muted-foreground"}`}>
                  {darkMode ? "TERMINAL" : "Light"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-[10px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live · Updated {lastRefresh.toLocaleTimeString()}
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> {liveSync.filter(s => s.status === "succeeded").length}/{liveSync.length} Synced
              </Badge>
              <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-600 bg-blue-50">
                <TickerNumber value={liveItemsSynced} /> items synced
              </Badge>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
            {([
              { key: "overview", label: "Overview", icon: BarChart3 },
              { key: "explorer", label: "File Explorer", icon: FolderOpen },
              { key: "drives", label: "Drives", icon: Cloud },
              { key: "versions", label: "Versions", icon: GitBranch },
              { key: "permissions", label: "Permissions", icon: Shield },
              { key: "sync", label: "Sync Status", icon: RefreshCw },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all ${activeTab === tab.key ? "bg-card shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          {/* ═══ OVERVIEW TAB ═══ */}
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <KPICard icon={FileText} label="Total Files" value={liveFileCount} color="bg-blue-100 text-blue-600" delay={0.1} href="/storage" />
                <KPICard icon={Database} label="Total Storage" value={Math.round(liveTotalSize / 1048576)} suffix=" MB" color="bg-emerald-100 text-emerald-600" delay={0.15} href="/storage" />
                <KPICard icon={Cloud} label="Total Drives" value={mockDrives.length} color="bg-violet-100 text-violet-600" delay={0.2} href="/drives" />
                <KPICard icon={Copy} label="Duplicates" value={duplicateFileCount} color="bg-amber-100 text-amber-600" delay={0.25} href="/duplicates" />
                <KPICard icon={GitBranch} label="File Versions" value={mockFileVersions.length} color="bg-sky-100 text-sky-600" delay={0.3} href="/versions" />
                <KPICard icon={Share2} label="Shared Files" value={sharedItems.size} color="bg-pink-100 text-pink-600" delay={0.35} href="/shared" />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[hsl(var(--primary))]" /> Storage by Drive
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={driveStorageData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {driveStorageData.map((_, i) => <Cell key={i} fill={DRIVE_COLORS[i % DRIVE_COLORS.length]} />)}
                      </Pie>
                      <RTooltip contentStyle={termTooltipStyle} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5 lg:col-span-2">
                  <h3 className="text-sm font-semibold mb-4">File Category Distribution (TB)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} width={80} />
                      <RTooltip contentStyle={termTooltipStyle} />
                      <Bar dataKey="size" radius={[0, 4, 4, 0]} fill="url(#barGrad)" />
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(217,91%,50%)" />
                          <stop offset="100%" stopColor="hsl(262,83%,58%)" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Growth + Duplicates */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Storage Growth Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={STORAGE_GROWTH}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                      <RTooltip contentStyle={termTooltipStyle} />
                      <Line type="monotone" dataKey="storage" stroke="hsl(217,91%,50%)" strokeWidth={2} dot={{ fill: "hsl(217,91%,50%)", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-5">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Copy className="w-4 h-4 text-amber-500" /> Duplicate Analysis (by Checksum)
                  </h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-secondary rounded-lg">
                      <p className="text-lg font-bold text-[hsl(var(--primary))]">{duplicateGroups.length}</p>
                      <p className="text-[10px] text-muted-foreground">Duplicate Groups</p>
                    </div>
                    <div className="text-center p-3 bg-secondary rounded-lg">
                      <p className="text-lg font-bold text-amber-600">{duplicateFileCount}</p>
                      <p className="text-[10px] text-muted-foreground">Total Copies</p>
                    </div>
                    <div className="text-center p-3 bg-secondary rounded-lg">
                      <p className="text-lg font-bold text-red-500">{formatSize(wastedSize)}</p>
                      <p className="text-[10px] text-muted-foreground">Storage Wasted</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {duplicateGroups.map(([checksum, ids], idx) => {
                      const items = ids.map(id => mockItems.find(i => i.item_id === id)!);
                      const drives = items.map(i => mockDrives.find(d => d.drive_id === i.drive_id)?.name || "");
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg text-xs">
                          <div>
                            <p className="font-medium">{items[0].name}</p>
                            <p className="text-[10px] text-muted-foreground">{drives.join(" · ")}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{formatSize(items[0].size)}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* User Activity */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-500" /> User Activity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {userActivity.map(u => (
                    <div key={u.user_id} className="p-3 bg-secondary/50 rounded-lg text-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center mx-auto mb-2">
                        <span className="text-white text-xs font-bold">{u.name.split(" ").map(n => n[0]).join("")}</span>
                      </div>
                      <p className="text-xs font-medium truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground">{u.fileCount} files · {formatSize(u.storageUsed)}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* File Search with Export */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Search className="w-4 h-4 text-[hsl(var(--primary))]" /> Global File Search
                  </h3>
                  <button onClick={handleExportFiles} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs text-secondary-foreground hover:bg-secondary/80 transition">
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search files by name or path..."
                      className="pl-9 text-xs bg-secondary border-0" />
                    {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-muted-foreground" /></button>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    {["All", ...mockDrives.map(d => d.drive_id)].map(s => (
                      <button key={s} onClick={() => setDriveFilter(s)}
                        className={`text-[10px] px-2 py-1 rounded-full transition-colors ${driveFilter === s ? "bg-[hsl(var(--primary))] text-white" : "bg-secondary text-secondary-foreground hover:bg-[hsl(var(--primary))]/10"}`}>
                        {s === "All" ? "All" : mockDrives.find(d => d.drive_id === s)?.name.split(" ")[0] || s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border">
                      {["File Name", "Drive", "Type", "Size", "Created By", "Path"].map(h => (
                        <th key={h} className="text-left p-2.5 text-muted-foreground font-medium text-[10px] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filteredFiles.map(f => (
                        <tr key={f.item_id} className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors">
                          <td className="p-2.5 font-medium">{f.name}</td>
                          <td className="p-2.5"><DriveBadge type={mockDrives.find(d => d.drive_id === f.drive_id)?.drive_type || "personal"} /></td>
                          <td className="p-2.5 text-muted-foreground">{mockFileProperties.find(fp => fp.item_id === f.item_id)?.extension || ""}</td>
                          <td className="p-2.5">{formatSize(f.size)}</td>
                          <td className="p-2.5 text-muted-foreground">{mockUsers.find(u => u.user_id === f.created_by)?.name || ""}</td>
                          <td className="p-2.5 text-muted-foreground font-mono text-[10px] max-w-[200px] truncate">{f.path_display}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Alerts */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Alerts & Recommendations
                </h3>
                <div className="space-y-2">
                  {ALERTS.map((a, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${alertColors[a.type]}`}>
                      <a.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <p className="text-xs flex-1">{a.text}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{a.time}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ═══ FILE EXPLORER TAB ═══ */}
          {activeTab === "explorer" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-muted-foreground">Drive:</span>
                {mockDrives.map(d => (
                  <button key={d.drive_id} onClick={() => { setExplorerDrive(d.drive_id); setSelectedNode(null); }}
                    className={`text-[10px] px-3 py-1.5 rounded-full transition-colors ${explorerDrive === d.drive_id ? "bg-[hsl(var(--primary))] text-white" : "bg-secondary text-secondary-foreground hover:bg-[hsl(var(--primary))]/10"}`}>
                    {d.name.split(" ")[0]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 500 }}>
                {/* Tree */}
                <div className="glass-card p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-500" /> Folder Tree
                  </h3>
                  <ScrollArea className="h-[450px]">
                    <div className="space-y-0.5">
                      {explorerTree.map(node => (
                        <TreeItem key={node.id} node={node} selectedId={selectedNode?.id || null} onSelect={setSelectedNode} />
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-2 glass-card p-5">
                  {selectedNode ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="flex items-center gap-3 mb-4">
                        {selectedNode.type === "folder" ? <Folder className="w-6 h-6 text-amber-500" /> : <File className="w-6 h-6 text-blue-500" />}
                        <div>
                          <h3 className="font-semibold">{selectedNode.name}</h3>
                          <p className="text-[10px] text-muted-foreground">{selectedNode.item?.path_display}</p>
                        </div>
                      </div>

                      {selectedNode.type === "file" && selectedNode.item && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 bg-secondary rounded-lg"><p className="text-[10px] text-muted-foreground">Size</p><p className="font-semibold text-sm">{formatSize(selectedNode.item.size)}</p></div>
                            <div className="p-3 bg-secondary rounded-lg"><p className="text-[10px] text-muted-foreground">Type</p><p className="font-semibold text-sm">{mockFileProperties.find(fp => fp.item_id === selectedNode.item?.item_id)?.extension || "—"}</p></div>
                            <div className="p-3 bg-secondary rounded-lg"><p className="text-[10px] text-muted-foreground">Created</p><p className="font-semibold text-sm">{selectedNode.item.created_at}</p></div>
                            <div className="p-3 bg-secondary rounded-lg"><p className="text-[10px] text-muted-foreground">Modified</p><p className="font-semibold text-sm">{selectedNode.item.last_modified_at}</p></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-secondary rounded-lg"><p className="text-[10px] text-muted-foreground">Created By</p><p className="font-semibold text-sm">{mockUsers.find(u => u.user_id === selectedNode.item?.created_by)?.name || "—"}</p></div>
                            <div className="p-3 bg-secondary rounded-lg"><p className="text-[10px] text-muted-foreground">Checksum</p><p className="font-mono text-[10px]">{mockFileProperties.find(fp => fp.item_id === selectedNode.item?.item_id)?.checksum || "—"}</p></div>
                          </div>
                          {/* Versions */}
                          {(() => {
                            const versions = mockFileVersions.filter(v => v.item_id === selectedNode.item?.item_id);
                            if (versions.length === 0) return null;
                            return (
                              <div>
                                <h4 className="text-xs font-semibold mb-2">Versions ({versions.length})</h4>
                                <div className="flex gap-2 flex-wrap">
                                  {versions.sort((a, b) => a.version_number - b.version_number).map(v => (
                                    <div key={v.version_id} className={`px-3 py-1.5 rounded-lg text-xs ${v.is_current ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                                      v{v.version_number} {v.is_current && <CheckCircle2 className="w-3 h-3 inline ml-1" />}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                          {/* Permissions */}
                          {(() => {
                            const perms = mockPermissions.filter(p => p.item_id === selectedNode.item?.item_id);
                            if (perms.length === 0) return null;
                            return (
                              <div>
                                <h4 className="text-xs font-semibold mb-2">Permissions ({perms.length})</h4>
                                <div className="flex gap-1 flex-wrap">
                                  {perms.map(p => (
                                    <span key={p.permission_id} className={`text-[10px] px-2 py-1 rounded ${p.role === "owner" ? "bg-blue-100 text-blue-700" : p.role === "write" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                      {mockUsers.find(u => u.user_id === p.user_id)?.name.split(" ")[0]} ({p.role})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {selectedNode.type === "folder" && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-3">{selectedNode.children.length} items in this folder</p>
                          <div className="space-y-1">
                            {selectedNode.children.map(child => (
                              <div key={child.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer text-xs" onClick={() => setSelectedNode(child)}>
                                {child.type === "folder" ? <Folder className="w-3.5 h-3.5 text-amber-500" /> : <File className="w-3.5 h-3.5 text-blue-500" />}
                                <span className="flex-1">{child.name}</span>
                                {child.type === "file" && child.item && <span className="text-muted-foreground">{formatSize(child.item.size)}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Select a file or folder to view details</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ DRIVES TAB ═══ */}
          {activeTab === "drives" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockDrives.map((drive, idx) => {
                  const fileCount = mockItems.filter(i => i.drive_id === drive.drive_id && i.item_type === "file").length;
                  const driveSize = mockItems.filter(i => i.drive_id === drive.drive_id && i.item_type === "file").reduce((a, i) => a + i.size, 0);
                  const syncRun = mockSyncRuns.find(s => s.drive_id === drive.drive_id);
                  const owner = mockUsers.find(u => u.user_id === drive.owner_user_id);
                  return (
                    <motion.div key={drive.drive_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                      className="glass-card p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: DRIVE_COLORS[idx % DRIVE_COLORS.length] + "20" }}>
                            <Cloud className="w-5 h-5" style={{ color: DRIVE_COLORS[idx % DRIVE_COLORS.length] }} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{drive.name}</p>
                            <DriveBadge type={drive.drive_type} />
                          </div>
                        </div>
                        {syncRun && <SyncStatusIcon status={syncRun.status} />}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="p-2 bg-secondary rounded-lg text-center">
                          <p className="text-lg font-bold">{fileCount}</p>
                          <p className="text-[10px] text-muted-foreground">Files</p>
                        </div>
                        <div className="p-2 bg-secondary rounded-lg text-center">
                          <p className="text-lg font-bold">{formatSize(driveSize)}</p>
                          <p className="text-[10px] text-muted-foreground">Storage</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-[10px] text-muted-foreground">
                          Owner: <span className="text-foreground">{owner?.name || "—"}</span>
                          {syncRun && <> · Last sync: {new Date(syncRun.run_started_at).toLocaleTimeString()}</>}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══ VERSIONS TAB ═══ */}
          {activeTab === "versions" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-[hsl(var(--primary))]">{mockFileVersions.length}</p>
                  <p className="text-xs text-muted-foreground">Total Versions</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-violet-500">{multiVersionFiles.length}</p>
                  <p className="text-xs text-muted-foreground">Multi-Version Files</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-amber-500">{multiVersionFiles[0]?.[1] || 0}</p>
                  <p className="text-xs text-muted-foreground">Max Versions</p>
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><GitBranch className="w-4 h-4 text-violet-500" /> File Version History</h3>
                <div className="space-y-4">
                  {multiVersionFiles.map(([itemId, count]) => {
                    const item = mockItems.find(i => i.item_id === itemId)!;
                    const drive = mockDrives.find(d => d.drive_id === item.drive_id);
                    const versions = mockFileVersions.filter(v => v.item_id === itemId).sort((a, b) => a.version_number - b.version_number);
                    return (
                      <div key={itemId} className="p-4 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">{drive?.name} · {item.path_display}</p>
                          </div>
                          <Badge className="bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border-0 text-[10px]">{count} versions</Badge>
                        </div>
                        <div className="flex gap-2">
                          {versions.map(v => (
                            <div key={v.version_id} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] ${v.is_current ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                              <span>v{v.version_number}</span>
                              {v.is_current && <CheckCircle2 className="w-2.5 h-2.5" />}
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Created by: {mockUsers.find(u => u.user_id === versions[0]?.created_by)?.name || "—"} · Size: {formatSize(item.size)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ PERMISSIONS TAB ═══ */}
          {activeTab === "permissions" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[hsl(var(--primary))]" /> Permission Roles
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={permissionPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {permissionPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <RTooltip contentStyle={termTooltipStyle} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center p-2 bg-blue-50 rounded-lg"><p className="font-bold text-blue-600">{roleCount.owner}</p><p className="text-[10px] text-muted-foreground">Owner</p></div>
                    <div className="text-center p-2 bg-amber-50 rounded-lg"><p className="font-bold text-amber-600">{roleCount.write}</p><p className="text-[10px] text-muted-foreground">Write</p></div>
                    <div className="text-center p-2 bg-emerald-50 rounded-lg"><p className="font-bold text-emerald-600">{roleCount.read}</p><p className="text-[10px] text-muted-foreground">Read</p></div>
                  </div>
                </div>

                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-500" /> Permission Subjects
                  </h3>
                  <div className="space-y-3">
                    {mockSubjects.map(s => (
                      <div key={s.subject_id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          s.subject_type === "user" ? "bg-blue-100 text-blue-600" :
                          s.subject_type === "group" ? "bg-violet-100 text-violet-600" :
                          s.subject_type === "link" ? "bg-amber-100 text-amber-600" :
                          "bg-emerald-100 text-emerald-600"
                        }`}>
                          {s.subject_type === "user" ? <User className="w-4 h-4" /> :
                           s.subject_type === "group" ? <Users className="w-4 h-4" /> :
                           s.subject_type === "link" ? <Share2 className="w-4 h-4" /> :
                           <Database className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-medium">{s.display_name}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{s.subject_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-4">Most Shared Files</h3>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border">
                    {["File", "Drive", "Permissions", "Roles"].map(h => (
                      <th key={h} className="text-left p-2.5 text-muted-foreground font-medium text-[10px] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...sharedItems].map(itemId => {
                      const item = mockItems.find(i => i.item_id === itemId);
                      if (!item) return null;
                      const perms = mockPermissions.filter(p => p.item_id === itemId);
                      const drive = mockDrives.find(d => d.drive_id === item.drive_id);
                      return (
                        <tr key={itemId} className="border-b border-border/50 last:border-0 hover:bg-secondary/50">
                          <td className="p-2.5 font-medium">{item.name}</td>
                          <td className="p-2.5"><DriveBadge type={drive?.drive_type || "personal"} /></td>
                          <td className="p-2.5">{perms.length} users</td>
                          <td className="p-2.5">
                            <div className="flex gap-1 flex-wrap">
                              {perms.map(p => (
                                <span key={p.permission_id} className={`text-[9px] px-1.5 py-0.5 rounded ${
                                  p.role === "owner" ? "bg-blue-100 text-blue-700" :
                                  p.role === "write" ? "bg-amber-100 text-amber-700" :
                                  "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {p.role === "owner" ? <Eye className="w-2 h-2 inline mr-0.5" /> :
                                   p.role === "write" ? <Edit3 className="w-2 h-2 inline mr-0.5" /> :
                                   <Eye className="w-2 h-2 inline mr-0.5" />}
                                  {mockUsers.find(u => u.user_id === p.user_id)?.name.split(" ")[0] || ""}
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

          {/* ═══ SYNC TAB ═══ */}
          {activeTab === "sync" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-500">{liveSync.filter(s => s.status === "succeeded").length}</p>
                  <p className="text-xs text-muted-foreground">Succeeded</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-blue-500">{liveSync.filter(s => s.status === "running").length}</p>
                  <p className="text-xs text-muted-foreground">Running</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-red-500">{liveSync.filter(s => s.status === "failed").length}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-[hsl(var(--primary))]"><TickerNumber value={liveSync.reduce((a, s) => a + s.stats_json.items_synced, 0)} showDelta /></p>
                  <p className="text-xs text-muted-foreground">Total Items Synced</p>
                </div>
              </div>

              <div className="space-y-3">
                {liveSync.map((run, idx) => {
                  const drive = mockDrives.find(d => d.drive_id === run.drive_id);
                  return (
                    <motion.div key={run.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      className="glass-card p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <SyncStatusIcon status={run.status} />
                          <div>
                            <p className="font-medium text-sm">{drive?.name || run.drive_id}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Started: {new Date(run.run_started_at).toLocaleString()}
                              {run.run_completed_at && ` · Completed: ${new Date(run.run_completed_at).toLocaleTimeString()}`}
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-[10px] border-0 ${
                          run.status === "succeeded" ? "bg-emerald-100 text-emerald-700" :
                          run.status === "running" ? "bg-blue-100 text-blue-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {run.status}
                        </Badge>
                      </div>
                      {run.stats_json && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="p-2 bg-secondary rounded text-center">
                            <p className="font-bold text-sm"><TickerNumber value={run.stats_json.items_synced} showDelta={run.status === "running"} /></p>
                            <p className="text-[10px] text-muted-foreground">Synced</p>
                          </div>
                          <div className="p-2 bg-secondary rounded text-center">
                            <p className="font-bold text-sm"><TickerNumber value={run.stats_json.items_added} showDelta={run.status === "running"} /></p>
                            <p className="text-[10px] text-muted-foreground">Added</p>
                          </div>
                          <div className="p-2 bg-secondary rounded text-center">
                            <p className="font-bold text-sm"><TickerNumber value={run.stats_json.items_modified} showDelta={run.status === "running"} /></p>
                            <p className="text-[10px] text-muted-foreground">Modified</p>
                          </div>
                        </div>
                      )}
                      {run.error_message && (
                        <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-600">
                          ⚠️ {run.error_message}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
};

export default Index;
