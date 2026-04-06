import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  LineChart, Line, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";
import {
  Search, Send, Bot, User, HardDrive, Cloud, Database, Archive,
  FileText, AlertTriangle, TrendingUp, Copy, Layers, ShieldAlert,
  ChevronRight, Filter, X, Sparkles, ArrowUpRight, BarChart3,
  Users, RefreshCw, Shield, GitBranch, FolderOpen, CheckCircle2,
  XCircle, Clock, Share2, Eye, Edit3
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// ═══════════════════════════════════════════════════════════════════
// Mock Data — aligned to OneDrive DB schema
// ═══════════════════════════════════════════════════════════════════

const mockUsers = [
  { user_id: "u-001", aad_user_id: "aad-f1a2", name: "Priya Sharma", email: "priya.sharma@acme.com", user_principal_name: "priya.sharma@acme.com" },
  { user_id: "u-002", aad_user_id: "aad-b3c4", name: "Rahul Mehta", email: "rahul.mehta@acme.com", user_principal_name: "rahul.mehta@acme.com" },
  { user_id: "u-003", aad_user_id: "aad-d5e6", name: "Anita Desai", email: "anita.desai@acme.com", user_principal_name: "anita.desai@acme.com" },
  { user_id: "u-004", aad_user_id: "aad-g7h8", name: "Vikram Singh", email: "vikram.singh@acme.com", user_principal_name: "vikram.singh@acme.com" },
  { user_id: "u-005", aad_user_id: "aad-i9j0", name: "Neha Gupta", email: "neha.gupta@acme.com", user_principal_name: "neha.gupta@acme.com" },
];

const mockDrives = [
  { drive_id: "drv-001", drive_type: "personal", site_id: null, owner_user_id: "u-001", name: "Priya's OneDrive" },
  { drive_id: "drv-002", drive_type: "personal", site_id: null, owner_user_id: "u-002", name: "Rahul's OneDrive" },
  { drive_id: "drv-003", drive_type: "documentLibrary", site_id: "site-fin-001", owner_user_id: "u-003", name: "Finance Team Site" },
  { drive_id: "drv-004", drive_type: "documentLibrary", site_id: "site-hr-001", owner_user_id: "u-004", name: "HR Shared Library" },
  { drive_id: "drv-005", drive_type: "documentLibrary", site_id: "site-legal-001", owner_user_id: "u-005", name: "Legal & Compliance" },
];

const mockItems = [
  { item_id: "it-001", drive_id: "drv-001", parent_id: null, name: "invoice_2024_Q1.pdf", path_display: "/Documents/Finance/invoice_2024_Q1.pdf", item_type: "file", mime_type: "application/pdf", size: 2097152, created_by: "u-001", created_at: "2024-01-15", last_modified_at: "2024-03-10" },
  { item_id: "it-002", drive_id: "drv-003", parent_id: null, name: "invoice_2024_Q1.pdf", path_display: "/Shared/Invoices/invoice_2024_Q1.pdf", item_type: "file", mime_type: "application/pdf", size: 2097152, created_by: "u-003", created_at: "2024-01-16", last_modified_at: "2024-03-10" },
  { item_id: "it-003", drive_id: "drv-002", parent_id: null, name: "balance_sheet_2024.xlsx", path_display: "/Documents/Reports/balance_sheet_2024.xlsx", item_type: "file", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 5242880, created_by: "u-002", created_at: "2024-02-01", last_modified_at: "2024-04-01" },
  { item_id: "it-004", drive_id: "drv-003", parent_id: null, name: "audit_report_FY24.docx", path_display: "/Shared/Audit/audit_report_FY24.docx", item_type: "file", mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 8388608, created_by: "u-003", created_at: "2024-03-01", last_modified_at: "2024-03-28" },
  { item_id: "it-005", drive_id: "drv-004", parent_id: null, name: "employee_handbook_v3.pdf", path_display: "/HR/Policies/employee_handbook_v3.pdf", item_type: "file", mime_type: "application/pdf", size: 15728640, created_by: "u-004", created_at: "2023-06-15", last_modified_at: "2024-02-20" },
  { item_id: "it-006", drive_id: "drv-001", parent_id: null, name: "gstr_march_2024.xlsx", path_display: "/Documents/Tax/gstr_march_2024.xlsx", item_type: "file", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 1258291, created_by: "u-001", created_at: "2024-03-31", last_modified_at: "2024-04-02" },
  { item_id: "it-007", drive_id: "drv-005", parent_id: null, name: "sanctions_list_2024.pdf", path_display: "/Legal/Compliance/sanctions_list_2024.pdf", item_type: "file", mime_type: "application/pdf", size: 524288, created_by: "u-005", created_at: "2024-01-05", last_modified_at: "2024-01-05" },
  { item_id: "it-008", drive_id: "drv-002", parent_id: null, name: "training_data_backup.tar", path_display: "/Documents/ML/training_data_backup.tar", item_type: "file", mime_type: "application/x-tar", size: 4831838208, created_by: "u-002", created_at: "2024-02-15", last_modified_at: "2024-02-15" },
  { item_id: "it-009", drive_id: "drv-003", parent_id: null, name: "board_minutes_Q4.docx", path_display: "/Shared/Board/board_minutes_Q4.docx", item_type: "file", mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 1572864, created_by: "u-003", created_at: "2024-01-10", last_modified_at: "2024-01-15" },
  { item_id: "it-010", drive_id: "drv-001", parent_id: null, name: "credit_report_acme.pdf", path_display: "/Documents/Credit/credit_report_acme.pdf", item_type: "file", mime_type: "application/pdf", size: 3145728, created_by: "u-001", created_at: "2024-02-20", last_modified_at: "2024-02-20" },
  { item_id: "it-011", drive_id: "drv-004", parent_id: null, name: "balance_sheet_2024.xlsx", path_display: "/HR/Finance/balance_sheet_2024.xlsx", item_type: "file", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 5242880, created_by: "u-004", created_at: "2024-02-05", last_modified_at: "2024-04-01" },
  { item_id: "it-012", drive_id: "drv-005", parent_id: null, name: "contract_vendor_2024.pdf", path_display: "/Legal/Contracts/contract_vendor_2024.pdf", item_type: "file", mime_type: "application/pdf", size: 4194304, created_by: "u-005", created_at: "2024-03-15", last_modified_at: "2024-03-20" },
  { item_id: "it-013", drive_id: "drv-003", parent_id: null, name: "bank_statement_jan24.pdf", path_display: "/Shared/Banking/bank_statement_jan24.pdf", item_type: "file", mime_type: "application/pdf", size: 838860, created_by: "u-003", created_at: "2024-02-01", last_modified_at: "2024-02-01" },
  { item_id: "it-014", drive_id: "drv-001", parent_id: null, name: "presentation_Q1.pptx", path_display: "/Documents/Presentations/presentation_Q1.pptx", item_type: "file", mime_type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", size: 12582912, created_by: "u-001", created_at: "2024-03-20", last_modified_at: "2024-03-25" },
  { item_id: "it-015", drive_id: "drv-002", parent_id: null, name: "dataset_analysis.zip", path_display: "/Documents/Data/dataset_analysis.zip", item_type: "file", mime_type: "application/zip", size: 5368709120, created_by: "u-002", created_at: "2024-01-20", last_modified_at: "2024-01-20" },
];

const mockFileProperties = [
  { item_id: "it-001", mime_type: "application/pdf", extension: ".pdf", checksum: "sha256-abc123def" },
  { item_id: "it-002", mime_type: "application/pdf", extension: ".pdf", checksum: "sha256-abc123def" },
  { item_id: "it-003", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: ".xlsx", checksum: "sha256-xyz789ghi" },
  { item_id: "it-004", mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: ".docx", checksum: "sha256-aud456jkl" },
  { item_id: "it-005", mime_type: "application/pdf", extension: ".pdf", checksum: "sha256-hr789mno" },
  { item_id: "it-006", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: ".xlsx", checksum: "sha256-gst012pqr" },
  { item_id: "it-007", mime_type: "application/pdf", extension: ".pdf", checksum: "sha256-san345stu" },
  { item_id: "it-008", mime_type: "application/x-tar", extension: ".tar", checksum: "sha256-tar678vwx" },
  { item_id: "it-009", mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: ".docx", checksum: "sha256-min901yza" },
  { item_id: "it-010", mime_type: "application/pdf", extension: ".pdf", checksum: "sha256-crd234bcd" },
  { item_id: "it-011", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: ".xlsx", checksum: "sha256-xyz789ghi" },
  { item_id: "it-012", mime_type: "application/pdf", extension: ".pdf", checksum: "sha256-con567efg" },
  { item_id: "it-013", mime_type: "application/pdf", extension: ".pdf", checksum: "sha256-bnk890hij" },
  { item_id: "it-014", mime_type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extension: ".pptx", checksum: "sha256-ppt123klm" },
  { item_id: "it-015", mime_type: "application/zip", extension: ".zip", checksum: "sha256-dta456nop" },
];

const mockFileVersions = [
  { version_id: "v-001", item_id: "it-001", version_number: 1, blob_id: "b-001", created_by: "u-001", is_current: false },
  { version_id: "v-002", item_id: "it-001", version_number: 2, blob_id: "b-002", created_by: "u-001", is_current: true },
  { version_id: "v-003", item_id: "it-003", version_number: 1, blob_id: "b-003", created_by: "u-002", is_current: false },
  { version_id: "v-004", item_id: "it-003", version_number: 2, blob_id: "b-004", created_by: "u-002", is_current: false },
  { version_id: "v-005", item_id: "it-003", version_number: 3, blob_id: "b-005", created_by: "u-002", is_current: true },
  { version_id: "v-006", item_id: "it-004", version_number: 1, blob_id: "b-006", created_by: "u-003", is_current: false },
  { version_id: "v-007", item_id: "it-004", version_number: 2, blob_id: "b-007", created_by: "u-003", is_current: true },
  { version_id: "v-008", item_id: "it-005", version_number: 1, blob_id: "b-008", created_by: "u-004", is_current: false },
  { version_id: "v-009", item_id: "it-005", version_number: 2, blob_id: "b-009", created_by: "u-004", is_current: false },
  { version_id: "v-010", item_id: "it-005", version_number: 3, blob_id: "b-010", created_by: "u-004", is_current: true },
  { version_id: "v-011", item_id: "it-014", version_number: 1, blob_id: "b-011", created_by: "u-001", is_current: false },
  { version_id: "v-012", item_id: "it-014", version_number: 2, blob_id: "b-012", created_by: "u-001", is_current: false },
  { version_id: "v-013", item_id: "it-014", version_number: 3, blob_id: "b-013", created_by: "u-001", is_current: false },
  { version_id: "v-014", item_id: "it-014", version_number: 4, blob_id: "b-014", created_by: "u-001", is_current: true },
];

const mockPermissions = [
  { permission_id: "p-001", item_id: "it-001", user_id: "u-001", role: "owner" },
  { permission_id: "p-002", item_id: "it-001", user_id: "u-003", role: "read" },
  { permission_id: "p-003", item_id: "it-002", user_id: "u-003", role: "owner" },
  { permission_id: "p-004", item_id: "it-002", user_id: "u-001", role: "write" },
  { permission_id: "p-005", item_id: "it-003", user_id: "u-002", role: "owner" },
  { permission_id: "p-006", item_id: "it-003", user_id: "u-001", role: "read" },
  { permission_id: "p-007", item_id: "it-004", user_id: "u-003", role: "owner" },
  { permission_id: "p-008", item_id: "it-004", user_id: "u-002", role: "write" },
  { permission_id: "p-009", item_id: "it-004", user_id: "u-005", role: "read" },
  { permission_id: "p-010", item_id: "it-005", user_id: "u-004", role: "owner" },
  { permission_id: "p-011", item_id: "it-005", user_id: "u-001", role: "read" },
  { permission_id: "p-012", item_id: "it-005", user_id: "u-002", role: "read" },
  { permission_id: "p-013", item_id: "it-005", user_id: "u-003", role: "read" },
  { permission_id: "p-014", item_id: "it-009", user_id: "u-003", role: "owner" },
  { permission_id: "p-015", item_id: "it-009", user_id: "u-001", role: "write" },
  { permission_id: "p-016", item_id: "it-009", user_id: "u-002", role: "write" },
  { permission_id: "p-017", item_id: "it-012", user_id: "u-005", role: "owner" },
  { permission_id: "p-018", item_id: "it-012", user_id: "u-003", role: "read" },
  { permission_id: "p-019", item_id: "it-014", user_id: "u-001", role: "owner" },
  { permission_id: "p-020", item_id: "it-014", user_id: "u-002", role: "write" },
  { permission_id: "p-021", item_id: "it-014", user_id: "u-003", role: "read" },
  { permission_id: "p-022", item_id: "it-014", user_id: "u-004", role: "read" },
];

const mockSyncRuns = [
  { id: 1, drive_id: "drv-001", run_started_at: "2024-04-06T08:00:00", run_completed_at: "2024-04-06T08:12:34", status: "succeeded" as const, stats_json: { items_synced: 342, items_added: 12, items_modified: 8 } },
  { id: 2, drive_id: "drv-002", run_started_at: "2024-04-06T08:05:00", run_completed_at: "2024-04-06T08:18:45", status: "succeeded" as const, stats_json: { items_synced: 567, items_added: 23, items_modified: 5 } },
  { id: 3, drive_id: "drv-003", run_started_at: "2024-04-06T08:10:00", run_completed_at: "2024-04-06T08:25:12", status: "succeeded" as const, stats_json: { items_synced: 1245, items_added: 45, items_modified: 32 } },
  { id: 4, drive_id: "drv-004", run_started_at: "2024-04-06T08:15:00", run_completed_at: null, status: "running" as const, stats_json: { items_synced: 120, items_added: 3, items_modified: 1 } },
  { id: 5, drive_id: "drv-005", run_started_at: "2024-04-06T07:00:00", run_completed_at: "2024-04-06T07:05:23", status: "failed" as const, stats_json: { items_synced: 0, items_added: 0, items_modified: 0 }, error_message: "Delta token expired, full sync required" },
];

const mockSubjects = [
  { subject_id: 1, subject_type: "user" as const, aad_object_id: "aad-f1a2", display_name: "Priya Sharma" },
  { subject_id: 2, subject_type: "user" as const, aad_object_id: "aad-b3c4", display_name: "Rahul Mehta" },
  { subject_id: 3, subject_type: "group" as const, aad_object_id: "grp-fin-001", display_name: "Finance Team" },
  { subject_id: 4, subject_type: "link" as const, link_id: "lnk-ext-001", display_name: "External Share Link" },
  { subject_id: 5, subject_type: "application" as const, aad_object_id: "app-backup-001", display_name: "Backup Service" },
];

// ── Derived data ──
const STORAGE_GROWTH = [
  { month: "Oct", storage: 38 },
  { month: "Nov", storage: 42 },
  { month: "Dec", storage: 45 },
  { month: "Jan", storage: 50 },
  { month: "Feb", storage: 55 },
  { month: "Mar", storage: 60 },
  { month: "Apr", storage: 64 },
];

const CATEGORY_DATA = [
  { name: "Invoices", size: 14.2 },
  { name: "Bank Statements", size: 12.1 },
  { name: "Financials", size: 10.8 },
  { name: "GSTR", size: 8.5 },
  { name: "Auditors Report", size: 7.2 },
  { name: "Sanction Letters", size: 6.9 },
  { name: "Presentations", size: 5.4 },
  { name: "Credit Reports", size: 4.8 },
  { name: "Others", size: 8.1 },
];

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
        const fileCount = mockItems.filter(i => i.drive_id === d.drive_id).length;
        const totalSize = mockItems.filter(i => i.drive_id === d.drive_id).reduce((a, i) => a + i.size, 0);
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
    const sorted = [...mockItems].sort((a, b) => b.size - a.size).slice(0, 5);
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
    content: `I analyzed your OneDrive ecosystem: **${mockDrives.length} drives**, **${mockItems.length} items**, **${mockFileVersions.length} file versions**, **${mockPermissions.length} permissions**. Try asking about drives, duplicates, versions, permissions, or sync status.`,
  };
}

// ── Helpers ──
function formatSize(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const step = Math.max(1, Math.floor(value / 60));
    const interval = duration / (value / step);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, interval);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

// ── Drive badge ──
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

// ── Sync status icon ──
function SyncStatusIcon({ status }: { status: string }) {
  if (status === "succeeded") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "running") return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
  if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-muted-foreground" />;
}

// ── KPI Card ──
function KPICard({ icon: Icon, label, value, suffix, prefix, color, delay }: {
  icon: typeof Cloud; label: string; value: number; suffix?: string; prefix?: string; color: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
      className="glass-card p-5 stat-glow group hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-[hsl(var(--primary))] transition-colors" />
      </div>
      <p className="text-2xl font-bold tracking-tight">
        <AnimatedCounter value={value} suffix={suffix} prefix={prefix} />
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

// ── Tooltip style ──
const tooltipStyle = { background: "#fff", border: "1px solid hsl(220,13%,91%)", borderRadius: 8, fontSize: 11, color: "#333" };

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════
const Index = () => {
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: "agent", content: "Hello! I'm your **OneDrive Intelligence Agent**. Ask me about drives, file versions, permissions, sync status, or duplicates across your OneDrive ecosystem." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [driveFilter, setDriveFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<"overview" | "drives" | "versions" | "permissions" | "sync">("overview");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMsg = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setTimeout(() => { setChatMessages(prev => [...prev, getAgentResponse(chatInput)]); }, 600);
  };

  // Derived computations
  const totalSize = mockItems.reduce((a, i) => a + i.size, 0);
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
    const size = mockItems.filter(i => i.drive_id === d.drive_id).reduce((a, i) => a + i.size, 0);
    return { name: d.name.replace("'s OneDrive", "").replace(" Site", ""), value: Math.round(size / 1048576), fullName: d.name };
  });
  const DRIVE_COLORS = ["hsl(217,91%,50%)", "hsl(262,83%,58%)", "hsl(142,71%,40%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)"];

  const filteredFiles = mockItems.filter(f => {
    const matchSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.path_display.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDrive = driveFilter === "All" || f.drive_id === driveFilter;
    return matchSearch && matchDrive;
  });

  // Version data
  const versionCounts: Record<string, number> = {};
  mockFileVersions.forEach(v => { versionCounts[v.item_id] = (versionCounts[v.item_id] || 0) + 1; });
  const multiVersionFiles = Object.entries(versionCounts).filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);

  // Permission breakdown
  const roleCount = { owner: 0, write: 0, read: 0 };
  mockPermissions.forEach(p => { if (p.role in roleCount) roleCount[p.role as keyof typeof roleCount]++; });
  const permissionPieData = [
    { name: "Owner", value: roleCount.owner, color: "hsl(217,91%,50%)" },
    { name: "Write", value: roleCount.write, color: "hsl(38,92%,50%)" },
    { name: "Read", value: roleCount.read, color: "hsl(142,71%,40%)" },
  ];

  // User activity
  const userActivity = mockUsers.map(u => {
    const fileCount = mockItems.filter(i => i.created_by === u.user_id).length;
    const storageUsed = mockItems.filter(i => i.created_by === u.user_id).reduce((a, i) => a + i.size, 0);
    return { ...u, fileCount, storageUsed };
  }).sort((a, b) => b.storageUsed - a.storageUsed);

  const alertColors: Record<string, string> = {
    warning: "border-l-[hsl(var(--warning))] bg-amber-50",
    danger: "border-l-destructive bg-red-50",
    info: "border-l-[hsl(var(--primary))] bg-blue-50",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── LEFT: Chat Panel ── */}
      <motion.div initial={{ x: -320 }} animate={{ x: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-[340px] min-w-[340px] flex flex-col border-r border-border bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm">OneDrive Intelligence Agent</h2>
              <p className="text-[10px] text-muted-foreground">Drives · Versions · Permissions · Sync</p>
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

        {/* Messages */}
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

        {/* Input */}
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
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="gradient-text">OneDrive File Intelligence</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Real-time analytics across {mockDrives.length} drives · {mockUsers.length} users</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> {mockSyncRuns.filter(s => s.status === "succeeded").length}/{mockSyncRuns.length} Synced
              </Badge>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
            {([
              { key: "overview", label: "Overview", icon: BarChart3 },
              { key: "drives", label: "Drives", icon: FolderOpen },
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
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <KPICard icon={FileText} label="Total Files" value={totalFiles} color="bg-blue-100 text-blue-600" delay={0.1} />
                <KPICard icon={Database} label="Total Storage" value={Math.round(totalSize / 1048576)} suffix=" MB" color="bg-emerald-100 text-emerald-600" delay={0.15} />
                <KPICard icon={FolderOpen} label="Total Drives" value={mockDrives.length} color="bg-violet-100 text-violet-600" delay={0.2} />
                <KPICard icon={Copy} label="Duplicates" value={duplicateFileCount} color="bg-amber-100 text-amber-600" delay={0.25} />
                <KPICard icon={GitBranch} label="File Versions" value={mockFileVersions.length} color="bg-sky-100 text-sky-600" delay={0.3} />
                <KPICard icon={Share2} label="Shared Files" value={sharedItems.size} color="bg-pink-100 text-pink-600" delay={0.35} />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Pie Chart — Storage by Drive */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[hsl(var(--primary))]" /> Storage by Drive
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={driveStorageData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {driveStorageData.map((_, i) => <Cell key={i} fill={DRIVE_COLORS[i % DRIVE_COLORS.length]} />)}
                      </Pie>
                      <RTooltip contentStyle={tooltipStyle} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Category Bar Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-5 lg:col-span-2">
                  <h3 className="text-sm font-semibold mb-4">File Category Distribution (TB)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} width={80} />
                      <RTooltip contentStyle={tooltipStyle} />
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
                      <RTooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="storage" stroke="hsl(217,91%,50%)" strokeWidth={2} dot={{ fill: "hsl(217,91%,50%)", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Duplicate Analysis */}
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

              {/* File Search */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4 text-[hsl(var(--primary))]" /> Global File Search
                </h3>
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

          {/* ═══ DRIVES TAB ═══ */}
          {activeTab === "drives" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockDrives.map((drive, idx) => {
                  const fileCount = mockItems.filter(i => i.drive_id === drive.drive_id).length;
                  const driveSize = mockItems.filter(i => i.drive_id === drive.drive_id).reduce((a, i) => a + i.size, 0);
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
                        </p>
                        {syncRun && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Last sync: <span className="text-foreground">{new Date(syncRun.run_started_at).toLocaleString()}</span>
                            {syncRun.stats_json && <span className="text-muted-foreground"> · {syncRun.stats_json.items_synced} items</span>}
                          </p>
                        )}
                        {drive.site_id && <p className="text-[10px] text-muted-foreground mt-1 font-mono">Site: {drive.site_id}</p>}
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
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[hsl(var(--primary))]" /> Files with Multiple Versions
                </h3>
                <div className="space-y-3">
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
                {/* Permission Role Breakdown */}
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[hsl(var(--primary))]" /> Permission Roles
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={permissionPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {permissionPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <RTooltip contentStyle={tooltipStyle} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <p className="font-bold text-blue-600">{roleCount.owner}</p>
                      <p className="text-[10px] text-muted-foreground">Owner</p>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded-lg">
                      <p className="font-bold text-amber-600">{roleCount.write}</p>
                      <p className="text-[10px] text-muted-foreground">Write</p>
                    </div>
                    <div className="text-center p-2 bg-emerald-50 rounded-lg">
                      <p className="font-bold text-emerald-600">{roleCount.read}</p>
                      <p className="text-[10px] text-muted-foreground">Read</p>
                    </div>
                  </div>
                </div>

                {/* Subject Types */}
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

              {/* Most Shared Files */}
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
                            <div className="flex gap-1">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-500">{mockSyncRuns.filter(s => s.status === "succeeded").length}</p>
                  <p className="text-xs text-muted-foreground">Succeeded</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-blue-500">{mockSyncRuns.filter(s => s.status === "running").length}</p>
                  <p className="text-xs text-muted-foreground">Running</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-red-500">{mockSyncRuns.filter(s => s.status === "failed").length}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>

              <div className="space-y-3">
                {mockSyncRuns.map((run, idx) => {
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
                            <p className="font-bold text-sm">{run.stats_json.items_synced}</p>
                            <p className="text-[10px] text-muted-foreground">Synced</p>
                          </div>
                          <div className="p-2 bg-secondary rounded text-center">
                            <p className="font-bold text-sm">{run.stats_json.items_added}</p>
                            <p className="text-[10px] text-muted-foreground">Added</p>
                          </div>
                          <div className="p-2 bg-secondary rounded text-center">
                            <p className="font-bold text-sm">{run.stats_json.items_modified}</p>
                            <p className="text-[10px] text-muted-foreground">Modified</p>
                          </div>
                        </div>
                      )}
                      {(run as any).error_message && (
                        <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-600">
                          ⚠️ {(run as any).error_message}
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
