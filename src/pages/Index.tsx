import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  LineChart, Line, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";
import {
  Search, Send, Bot, User, HardDrive, Cloud, Database, Archive,
  FileText, AlertTriangle, TrendingUp, Copy, Layers, ShieldAlert,
  ChevronRight, Filter, X, Sparkles, ArrowUpRight, BarChart3
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Mock Data ──────────────────────────────────────────────────────
const STORAGE_DIST = [
  { name: "S3", value: 32, color: "hsl(217,91%,60%)" },
  { name: "OneDrive", value: 18, color: "hsl(45,93%,58%)" },
  { name: "NAS", value: 20, color: "hsl(142,71%,45%)" },
  { name: "Glacier", value: 8, color: "hsl(270,70%,60%)" },
];

const CATEGORY_DATA = [
  { name: "Invoices", size: 14.2 },
  { name: "Bank Statements", size: 12.1 },
  { name: "Financials", size: 10.8 },
  { name: "GSTR", size: 8.5 },
  { name: "Auditors Report", size: 7.2 },
  { name: "Sanction Letters", size: 6.9 },
  { name: "Minutes of Meeting", size: 5.4 },
  { name: "Credit Reports", size: 4.8 },
  { name: "Others", size: 8.1 },
];

const GROWTH_DATA = [
  { month: "Jan", storage: 50 },
  { month: "Feb", storage: 55 },
  { month: "Mar", storage: 60 },
  { month: "Apr", storage: 64 },
  { month: "May", storage: 68 },
  { month: "Jun", storage: 72 },
  { month: "Jul", storage: 78 },
];

const DUPLICATE_FILES = [
  { name: "report.pdf", locations: ["S3", "NAS", "OneDrive"], size: "4 MB" },
  { name: "invoice_2024.pdf", locations: ["NAS", "S3"], size: "2 MB" },
  { name: "audit.docx", locations: ["NAS", "Glacier"], size: "8 MB" },
  { name: "balance_sheet_q3.xlsx", locations: ["S3", "OneDrive"], size: "3.5 MB" },
  { name: "tax_return_2023.pdf", locations: ["NAS", "S3", "Glacier"], size: "6 MB" },
];

const LARGEST_FILES = [
  { name: "dataset_backup.zip", source: "S3", category: "Archive", size: "5 GB" },
  { name: "training_data.tar", source: "NAS", category: "Backup", size: "4.5 GB" },
  { name: "video_archive.mp4", source: "S3", category: "Media", size: "4 GB" },
  { name: "db_snapshot_jan.sql", source: "Glacier", category: "Database", size: "3.8 GB" },
  { name: "logs_2024.tar.gz", source: "NAS", category: "Logs", size: "3.2 GB" },
];

const ALL_FILES = [
  { name: "invoice_2024.pdf", source: "S3", category: "Invoices", size: "2 MB", path: "/finance/invoices/" },
  { name: "report.pdf", source: "NAS", category: "Financials", size: "4 MB", path: "/reports/quarterly/" },
  { name: "gstr_march.xlsx", source: "OneDrive", category: "GSTR", size: "1.2 MB", path: "/tax/gstr/" },
  { name: "audit.docx", source: "Glacier", category: "Auditors Report", size: "8 MB", path: "/audit/2024/" },
  { name: "sanctions_list.pdf", source: "NAS", category: "Sanction Letters", size: "500 KB", path: "/compliance/" },
  { name: "board_minutes_q4.docx", source: "OneDrive", category: "Minutes of Meeting", size: "1.5 MB", path: "/board/" },
  { name: "credit_report_abc.pdf", source: "S3", category: "Credit Reports", size: "3 MB", path: "/credit/" },
  { name: "dataset_backup.zip", source: "S3", category: "Archive", size: "5 GB", path: "/backups/" },
  { name: "training_data.tar", source: "NAS", category: "Backup", size: "4.5 GB", path: "/ml/data/" },
  { name: "bank_stmt_jan.pdf", source: "NAS", category: "Bank Statements", size: "800 KB", path: "/banking/" },
];

const ALERTS = [
  { type: "warning", icon: Copy, text: "Duplicate files increased by 12% this month", time: "2h ago" },
  { type: "danger", icon: HardDrive, text: "NAS storage at 87% capacity — consider archiving", time: "5h ago" },
  { type: "info", icon: FileText, text: "142 large unused files detected (>1GB, untouched 90+ days)", time: "1d ago" },
  { type: "warning", icon: ShieldAlert, text: "3 files with sensitive data found without encryption", time: "1d ago" },
];

const SUGGESTED_PROMPTS = [
  "Find duplicate files",
  "Show storage usage",
  "Largest files",
  "Search invoices",
  "NAS storage statistics",
  "Category storage breakdown",
];

// ── Agent Response Logic ───────────────────────────────────────────
type ChatMsg = { role: "user" | "agent"; content: string; table?: { headers: string[]; rows: string[][] } };

function getAgentResponse(q: string): ChatMsg {
  const lq = q.toLowerCase();
  if (lq.includes("duplicate")) {
    return {
      role: "agent",
      content: "I found **21,345 duplicate files** across your storage systems, wasting approximately **1.8 TB** of space. Here are the top duplicates:",
      table: {
        headers: ["File", "Locations", "Size"],
        rows: DUPLICATE_FILES.map(f => [f.name, f.locations.join(", "), f.size]),
      },
    };
  }
  if (lq.includes("storage usage") || lq.includes("storage") && lq.includes("usage")) {
    return {
      role: "agent",
      content: "**Total Storage: 78 TB** across 4 sources:\n\n• **S3**: 32 TB (41%)\n• **NAS**: 20 TB (26%)\n• **OneDrive**: 18 TB (23%)\n• **Glacier**: 8 TB (10%)\n\nStorage grew 12% in the last quarter.",
    };
  }
  if (lq.includes("largest") || lq.includes("large")) {
    return {
      role: "agent",
      content: "Here are the **largest files** across all storage systems:",
      table: {
        headers: ["File", "Source", "Category", "Size"],
        rows: LARGEST_FILES.map(f => [f.name, f.source, f.category, f.size]),
      },
    };
  }
  if (lq.includes("invoice")) {
    return {
      role: "agent",
      content: "Found **2,847 invoice files** totaling **14.2 TB**. Most are stored on S3 and NAS. There are **312 duplicate invoices** consuming 890 MB of redundant space.",
      table: {
        headers: ["File", "Source", "Size", "Path"],
        rows: [
          ["invoice_2024.pdf", "S3", "2 MB", "/finance/invoices/"],
          ["invoice_2024.pdf", "NAS", "2 MB", "/shared/invoices/"],
          ["inv_march_2024.xlsx", "OneDrive", "1.5 MB", "/finance/"],
        ],
      },
    };
  }
  if (lq.includes("nas")) {
    return {
      role: "agent",
      content: "**NAS Storage Summary:**\n\n• **Total Capacity**: 23 TB\n• **Used**: 20 TB (87%)\n• **Available**: 3 TB\n• **Files**: 1,245,678\n\n⚠️ NAS is nearing capacity. Consider migrating cold data to Glacier.",
    };
  }
  if (lq.includes("category") || lq.includes("categories")) {
    return {
      role: "agent",
      content: "**Storage by Category:**\n\n1. **Invoices** — 14.2 TB (largest)\n2. **Bank Statements** — 12.1 TB\n3. **Financials** — 10.8 TB\n4. **GSTR** — 8.5 TB\n5. **Others** — 32.4 TB combined\n\nInvoices consume the most storage at 18.2% of total.",
    };
  }
  return {
    role: "agent",
    content: "I analyzed your query across all 4 storage systems. Your infrastructure manages **4.2M+ files** across **78 TB**. Could you be more specific? Try asking about duplicates, storage usage, largest files, or specific categories.",
  };
}

// ── Animated Counter ───────────────────────────────────────────────
function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const step = Math.max(1, Math.floor(value / 60));
    const interval = duration / (value / step);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

// ── Source Badge ────────────────────────────────────────────────────
const sourceColor: Record<string, string> = {
  S3: "bg-[hsl(217,91%,60%)]/20 text-[hsl(217,91%,60%)]",
  OneDrive: "bg-[hsl(45,93%,58%)]/20 text-[hsl(45,93%,58%)]",
  NAS: "bg-[hsl(142,71%,45%)]/20 text-[hsl(142,71%,45%)]",
  Glacier: "bg-[hsl(270,70%,60%)]/20 text-[hsl(270,70%,60%)]",
};

const sourceIcon: Record<string, typeof Cloud> = {
  S3: Cloud, OneDrive: Cloud, NAS: HardDrive, Glacier: Archive,
};

function SourceBadge({ source }: { source: string }) {
  const Icon = sourceIcon[source] || Database;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sourceColor[source] || "bg-muted text-muted-foreground"}`}>
      <Icon className="w-3 h-3" /> {source}
    </span>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, suffix, prefix, color, delay }: {
  icon: typeof Cloud; label: string; value: number; suffix?: string; prefix?: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card p-5 stat-glow group hover:scale-[1.02] transition-transform duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <p className="text-2xl font-bold tracking-tight">
        <AnimatedCounter value={value} suffix={suffix} prefix={prefix} />
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
const Index = () => {
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: "agent", content: "Hello! I'm your **File Intelligence Agent**. Ask me anything about your storage systems, files, duplicates, or categories across S3, OneDrive, NAS, and Glacier." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMsg = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setTimeout(() => {
      setChatMessages(prev => [...prev, getAgentResponse(chatInput)]);
    }, 600);
  };

  const filteredFiles = ALL_FILES.filter(f => {
    const matchSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSource = sourceFilter === "All" || f.source === sourceFilter;
    return matchSearch && matchSource;
  });

  const alertColors: Record<string, string> = {
    warning: "border-l-[hsl(var(--warning))] bg-[hsl(var(--warning))]/5",
    danger: "border-l-destructive bg-destructive/5",
    info: "border-l-primary bg-primary/5",
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── LEFT: Chat Panel ── */}
      <motion.div
        initial={{ x: -320 }} animate={{ x: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-[340px] min-w-[340px] flex flex-col border-r border-border bg-[hsl(var(--sidebar-background))]"
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-sm">File Intelligence Agent</h2>
              <p className="text-[10px] text-muted-foreground">Ask about storage, files, duplicates</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {SUGGESTED_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => { setChatInput(p); }}
                className="text-[10px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 scrollbar-thin">
          <div className="space-y-3">
            <AnimatePresence>
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex gap-2 max-w-[90%]">
                    {msg.role === "agent" && (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1 shrink-0">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <div>
                      <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-agent"}>
                        <p className="text-xs leading-relaxed whitespace-pre-line">{msg.content.split("**").map((part, idx) =>
                          idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part
                        )}</p>
                      </div>
                      {msg.table && (
                        <div className="mt-2 glass-card overflow-hidden">
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="border-b border-border">
                                {msg.table.headers.map(h => (
                                  <th key={h} className="text-left p-2 text-muted-foreground font-medium">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {msg.table.rows.map((row, ri) => (
                                <tr key={ri} className="border-b border-border/50 last:border-0">
                                  {row.map((cell, ci) => (
                                    <td key={ci} className="p-2">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center mt-1 shrink-0">
                        <User className="w-3.5 h-3.5 text-accent" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your files..."
              className="text-xs bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
            <button
              onClick={sendMessage}
              className="w-9 h-9 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center hover:opacity-90 transition shrink-0"
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── RIGHT: Dashboard ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="gradient-text">Unified File Intelligence</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Real-time analytics across S3 · OneDrive · NAS · Glacier</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-[hsl(var(--success))]/30 text-[hsl(var(--success))]">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] mr-1.5 animate-pulse" /> All Systems Online
              </Badge>
            </div>
          </motion.div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard icon={FileText} label="Total Files" value={4245678} color="bg-primary/20 text-primary" delay={0.1} />
            <KPICard icon={Database} label="Total Storage" value={78} suffix=" TB" color="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]" delay={0.15} />
            <KPICard icon={Copy} label="Duplicate Files" value={21345} color="bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]" delay={0.2} />
            <KPICard icon={Cloud} label="Cloud Sources" value={4} color="bg-accent/20 text-accent" delay={0.25} />
            <KPICard icon={Layers} label="Unique Files" value={4224333} color="bg-primary/20 text-primary" delay={0.3} />
            <KPICard icon={AlertTriangle} label="Storage Waste" value={1.8} suffix=" TB" color="bg-destructive/20 text-destructive" delay={0.35} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Pie Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Storage Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={STORAGE_DIST} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {STORAGE_DIST.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <RTooltip contentStyle={{ background: "hsl(222,47%,9%)", border: "1px solid hsl(222,30%,18%)", borderRadius: 8, fontSize: 11 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Category Bar Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold mb-4">File Category Distribution (TB)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,18%)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215,20%,55%)" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(215,20%,55%)" }} width={80} />
                  <RTooltip contentStyle={{ background: "hsl(222,47%,9%)", border: "1px solid hsl(222,30%,18%)", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="size" radius={[0, 4, 4, 0]} fill="url(#barGrad)" />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(217,91%,60%)" />
                      <stop offset="100%" stopColor="hsl(270,70%,60%)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Growth + Duplicates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Line Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[hsl(var(--success))]" /> Storage Growth Trend
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={GROWTH_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,18%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215,20%,55%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(215,20%,55%)" }} />
                  <RTooltip contentStyle={{ background: "hsl(222,47%,9%)", border: "1px solid hsl(222,30%,18%)", borderRadius: 8, fontSize: 11 }} />
                  <Line type="monotone" dataKey="storage" stroke="hsl(217,91%,60%)" strokeWidth={2} dot={{ fill: "hsl(217,91%,60%)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Duplicate Analysis */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Copy className="w-4 h-4 text-[hsl(var(--warning))]" /> Duplicate File Analysis
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { l: "Duplicate Groups", v: "8,234" },
                  { l: "Duplicate Files", v: "21,345" },
                  { l: "Storage Wasted", v: "1.8 TB" },
                ].map(s => (
                  <div key={s.l} className="bg-secondary rounded-lg p-3 text-center">
                    <p className="text-lg font-bold">{s.v}</p>
                    <p className="text-[10px] text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2">File</th>
                      <th className="text-left py-2">Locations</th>
                      <th className="text-right py-2">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DUPLICATE_FILES.slice(0, 4).map((f, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors">
                        <td className="py-2 font-medium">{f.name}</td>
                        <td className="py-2">
                          <div className="flex gap-1 flex-wrap">{f.locations.map(l => <SourceBadge key={l} source={l} />)}</div>
                        </td>
                        <td className="py-2 text-right text-muted-foreground">{f.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* Largest Files */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3">Largest Files</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2">File Name</th>
                    <th className="text-left py-2">Source</th>
                    <th className="text-left py-2">Category</th>
                    <th className="text-right py-2">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {LARGEST_FILES.map((f, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="py-2.5 font-medium">{f.name}</td>
                      <td className="py-2.5"><SourceBadge source={f.source} /></td>
                      <td className="py-2.5">
                        <Badge variant="secondary" className="text-[10px]">{f.category}</Badge>
                      </td>
                      <td className="py-2.5 text-right font-mono text-muted-foreground">{f.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Global Search */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" /> Global File Search
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search files across all storage..."
                  className="pl-9 text-xs bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                {["All", "S3", "NAS", "OneDrive", "Glacier"].map(s => (
                  <button
                    key={s}
                    onClick={() => setSourceFilter(s)}
                    className={`text-[10px] px-3 py-1.5 rounded-lg transition-colors ${
                      sourceFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2">File Name</th>
                    <th className="text-left py-2">Source</th>
                    <th className="text-left py-2">Category</th>
                    <th className="text-left py-2">Size</th>
                    <th className="text-left py-2">Path</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((f, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="py-2.5 font-medium">{f.name}</td>
                      <td className="py-2.5"><SourceBadge source={f.source} /></td>
                      <td className="py-2.5"><Badge variant="secondary" className="text-[10px]">{f.category}</Badge></td>
                      <td className="py-2.5 font-mono text-muted-foreground">{f.size}</td>
                      <td className="py-2.5 text-muted-foreground font-mono">{f.path}</td>
                    </tr>
                  ))}
                  {filteredFiles.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No files matching your search</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Alerts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" /> Alerts & Recommendations
            </h3>
            <div className="space-y-2">
              {ALERTS.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.08 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border-l-2 ${alertColors[a.type]}`}
                >
                  <a.icon className="w-4 h-4 shrink-0" />
                  <p className="text-xs flex-1">{a.text}</p>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{a.time}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
};

export default Index;
