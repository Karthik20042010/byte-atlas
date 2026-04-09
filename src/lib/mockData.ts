// ═══════════════════════════════════════════════════════════════════
// Shared Mock Data — aligned to OneDrive DB schema
// ═══════════════════════════════════════════════════════════════════

export const DEPARTMENTS = ["Finance", "Engineering", "Operations", "Sales"] as const;
export type Department = typeof DEPARTMENTS[number];

export const mockUsers = [
  { user_id: "u-001", aad_user_id: "aad-f1a2", name: "Priya Sharma", email: "priya.sharma@acme.com", user_principal_name: "priya.sharma@acme.com", department: "Finance" as Department },
  { user_id: "u-002", aad_user_id: "aad-b3c4", name: "Rahul Mehta", email: "rahul.mehta@acme.com", user_principal_name: "rahul.mehta@acme.com", department: "Engineering" as Department },
  { user_id: "u-003", aad_user_id: "aad-d5e6", name: "Anita Desai", email: "anita.desai@acme.com", user_principal_name: "anita.desai@acme.com", department: "Finance" as Department },
  { user_id: "u-004", aad_user_id: "aad-g7h8", name: "Vikram Singh", email: "vikram.singh@acme.com", user_principal_name: "vikram.singh@acme.com", department: "Operations" as Department },
  { user_id: "u-005", aad_user_id: "aad-i9j0", name: "Neha Gupta", email: "neha.gupta@acme.com", user_principal_name: "neha.gupta@acme.com", department: "Sales" as Department },
];

export const mockDrives = [
  { drive_id: "drv-001", drive_type: "personal", site_id: null, owner_user_id: "u-001", name: "Priya's OneDrive" },
  { drive_id: "drv-002", drive_type: "personal", site_id: null, owner_user_id: "u-002", name: "Rahul's OneDrive" },
  { drive_id: "drv-003", drive_type: "documentLibrary", site_id: "site-fin-001", owner_user_id: "u-003", name: "Finance Team Site" },
  { drive_id: "drv-004", drive_type: "documentLibrary", site_id: "site-hr-001", owner_user_id: "u-004", name: "HR Shared Library" },
  { drive_id: "drv-005", drive_type: "documentLibrary", site_id: "site-legal-001", owner_user_id: "u-005", name: "Legal & Compliance" },
];

export const mockItems = [
  // Folders
  { item_id: "fld-001", drive_id: "drv-001", parent_id: null, name: "Documents", path_display: "/Documents", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-001", created_at: "2023-01-01", last_modified_at: "2024-04-01" },
  { item_id: "fld-002", drive_id: "drv-001", parent_id: "fld-001", name: "Finance", path_display: "/Documents/Finance", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-001", created_at: "2023-01-01", last_modified_at: "2024-03-10" },
  { item_id: "fld-003", drive_id: "drv-001", parent_id: "fld-001", name: "Tax", path_display: "/Documents/Tax", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-001", created_at: "2023-06-01", last_modified_at: "2024-04-02" },
  { item_id: "fld-004", drive_id: "drv-001", parent_id: "fld-001", name: "Credit", path_display: "/Documents/Credit", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-001", created_at: "2023-08-01", last_modified_at: "2024-02-20" },
  { item_id: "fld-005", drive_id: "drv-001", parent_id: "fld-001", name: "Presentations", path_display: "/Documents/Presentations", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-001", created_at: "2023-03-01", last_modified_at: "2024-03-25" },
  { item_id: "fld-006", drive_id: "drv-002", parent_id: null, name: "Documents", path_display: "/Documents", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-002", created_at: "2023-01-01", last_modified_at: "2024-04-01" },
  { item_id: "fld-007", drive_id: "drv-002", parent_id: "fld-006", name: "Reports", path_display: "/Documents/Reports", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-002", created_at: "2023-02-01", last_modified_at: "2024-04-01" },
  { item_id: "fld-008", drive_id: "drv-002", parent_id: "fld-006", name: "ML", path_display: "/Documents/ML", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-002", created_at: "2023-05-01", last_modified_at: "2024-02-15" },
  { item_id: "fld-009", drive_id: "drv-002", parent_id: "fld-006", name: "Data", path_display: "/Documents/Data", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-002", created_at: "2023-04-01", last_modified_at: "2024-01-20" },
  { item_id: "fld-010", drive_id: "drv-003", parent_id: null, name: "Shared", path_display: "/Shared", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-003", created_at: "2023-01-01", last_modified_at: "2024-03-28" },
  { item_id: "fld-011", drive_id: "drv-003", parent_id: "fld-010", name: "Invoices", path_display: "/Shared/Invoices", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-003", created_at: "2023-01-01", last_modified_at: "2024-03-10" },
  { item_id: "fld-012", drive_id: "drv-003", parent_id: "fld-010", name: "Audit", path_display: "/Shared/Audit", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-003", created_at: "2023-03-01", last_modified_at: "2024-03-28" },
  { item_id: "fld-013", drive_id: "drv-003", parent_id: "fld-010", name: "Board", path_display: "/Shared/Board", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-003", created_at: "2023-02-01", last_modified_at: "2024-01-15" },
  { item_id: "fld-014", drive_id: "drv-003", parent_id: "fld-010", name: "Banking", path_display: "/Shared/Banking", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-003", created_at: "2023-06-01", last_modified_at: "2024-02-01" },
  { item_id: "fld-015", drive_id: "drv-004", parent_id: null, name: "HR", path_display: "/HR", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-004", created_at: "2023-01-01", last_modified_at: "2024-04-01" },
  { item_id: "fld-016", drive_id: "drv-004", parent_id: "fld-015", name: "Policies", path_display: "/HR/Policies", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-004", created_at: "2023-01-01", last_modified_at: "2024-02-20" },
  { item_id: "fld-017", drive_id: "drv-004", parent_id: "fld-015", name: "Finance", path_display: "/HR/Finance", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-004", created_at: "2023-04-01", last_modified_at: "2024-04-01" },
  { item_id: "fld-018", drive_id: "drv-005", parent_id: null, name: "Legal", path_display: "/Legal", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-005", created_at: "2023-01-01", last_modified_at: "2024-03-20" },
  { item_id: "fld-019", drive_id: "drv-005", parent_id: "fld-018", name: "Compliance", path_display: "/Legal/Compliance", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-005", created_at: "2023-01-01", last_modified_at: "2024-01-05" },
  { item_id: "fld-020", drive_id: "drv-005", parent_id: "fld-018", name: "Contracts", path_display: "/Legal/Contracts", item_type: "folder" as const, mime_type: null, size: 0, created_by: "u-005", created_at: "2023-02-01", last_modified_at: "2024-03-20" },
  // Files — now with proper parent_id references
  { item_id: "it-001", drive_id: "drv-001", parent_id: "fld-002", name: "invoice_2024_Q1.pdf", path_display: "/Documents/Finance/invoice_2024_Q1.pdf", item_type: "file" as const, mime_type: "application/pdf", size: 2097152, created_by: "u-001", created_at: "2024-01-15", last_modified_at: "2024-03-10" },
  { item_id: "it-002", drive_id: "drv-003", parent_id: "fld-011", name: "invoice_2024_Q1.pdf", path_display: "/Shared/Invoices/invoice_2024_Q1.pdf", item_type: "file" as const, mime_type: "application/pdf", size: 2097152, created_by: "u-003", created_at: "2024-01-16", last_modified_at: "2024-03-10" },
  { item_id: "it-003", drive_id: "drv-002", parent_id: "fld-007", name: "balance_sheet_2024.xlsx", path_display: "/Documents/Reports/balance_sheet_2024.xlsx", item_type: "file" as const, mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 5242880, created_by: "u-002", created_at: "2024-02-01", last_modified_at: "2024-04-01" },
  { item_id: "it-004", drive_id: "drv-003", parent_id: "fld-012", name: "audit_report_FY24.docx", path_display: "/Shared/Audit/audit_report_FY24.docx", item_type: "file" as const, mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 8388608, created_by: "u-003", created_at: "2024-03-01", last_modified_at: "2024-03-28" },
  { item_id: "it-005", drive_id: "drv-004", parent_id: "fld-016", name: "employee_handbook_v3.pdf", path_display: "/HR/Policies/employee_handbook_v3.pdf", item_type: "file" as const, mime_type: "application/pdf", size: 15728640, created_by: "u-004", created_at: "2023-06-15", last_modified_at: "2024-02-20" },
  { item_id: "it-006", drive_id: "drv-001", parent_id: "fld-003", name: "gstr_march_2024.xlsx", path_display: "/Documents/Tax/gstr_march_2024.xlsx", item_type: "file" as const, mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 1258291, created_by: "u-001", created_at: "2024-03-31", last_modified_at: "2024-04-02" },
  { item_id: "it-007", drive_id: "drv-005", parent_id: "fld-019", name: "sanctions_list_2024.pdf", path_display: "/Legal/Compliance/sanctions_list_2024.pdf", item_type: "file" as const, mime_type: "application/pdf", size: 524288, created_by: "u-005", created_at: "2024-01-05", last_modified_at: "2024-01-05" },
  { item_id: "it-008", drive_id: "drv-002", parent_id: "fld-008", name: "training_data_backup.tar", path_display: "/Documents/ML/training_data_backup.tar", item_type: "file" as const, mime_type: "application/x-tar", size: 4831838208, created_by: "u-002", created_at: "2024-02-15", last_modified_at: "2024-02-15" },
  { item_id: "it-009", drive_id: "drv-003", parent_id: "fld-013", name: "board_minutes_Q4.docx", path_display: "/Shared/Board/board_minutes_Q4.docx", item_type: "file" as const, mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 1572864, created_by: "u-003", created_at: "2024-01-10", last_modified_at: "2024-01-15" },
  { item_id: "it-010", drive_id: "drv-001", parent_id: "fld-004", name: "credit_report_acme.pdf", path_display: "/Documents/Credit/credit_report_acme.pdf", item_type: "file" as const, mime_type: "application/pdf", size: 3145728, created_by: "u-001", created_at: "2024-02-20", last_modified_at: "2024-02-20" },
  { item_id: "it-011", drive_id: "drv-004", parent_id: "fld-017", name: "balance_sheet_2024.xlsx", path_display: "/HR/Finance/balance_sheet_2024.xlsx", item_type: "file" as const, mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 5242880, created_by: "u-004", created_at: "2024-02-05", last_modified_at: "2024-04-01" },
  { item_id: "it-012", drive_id: "drv-005", parent_id: "fld-020", name: "contract_vendor_2024.pdf", path_display: "/Legal/Contracts/contract_vendor_2024.pdf", item_type: "file" as const, mime_type: "application/pdf", size: 4194304, created_by: "u-005", created_at: "2024-03-15", last_modified_at: "2024-03-20" },
  { item_id: "it-013", drive_id: "drv-003", parent_id: "fld-014", name: "bank_statement_jan24.pdf", path_display: "/Shared/Banking/bank_statement_jan24.pdf", item_type: "file" as const, mime_type: "application/pdf", size: 838860, created_by: "u-003", created_at: "2024-02-01", last_modified_at: "2024-02-01" },
  { item_id: "it-014", drive_id: "drv-001", parent_id: "fld-005", name: "presentation_Q1.pptx", path_display: "/Documents/Presentations/presentation_Q1.pptx", item_type: "file" as const, mime_type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", size: 12582912, created_by: "u-001", created_at: "2024-03-20", last_modified_at: "2024-03-25" },
  { item_id: "it-015", drive_id: "drv-002", parent_id: "fld-009", name: "dataset_analysis.zip", path_display: "/Documents/Data/dataset_analysis.zip", item_type: "file" as const, mime_type: "application/zip", size: 5368709120, created_by: "u-002", created_at: "2024-01-20", last_modified_at: "2024-01-20" },
];

export const mockFileProperties = [
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

export const mockFileVersions = [
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

export const mockPermissions = [
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

export const mockSyncRuns = [
  { id: 1, drive_id: "drv-001", run_started_at: "2024-04-06T08:00:00", run_completed_at: "2024-04-06T08:12:34", status: "succeeded" as const, stats_json: { items_synced: 342, items_added: 12, items_modified: 8 }, error_message: null },
  { id: 2, drive_id: "drv-002", run_started_at: "2024-04-06T08:05:00", run_completed_at: "2024-04-06T08:18:45", status: "succeeded" as const, stats_json: { items_synced: 567, items_added: 23, items_modified: 5 }, error_message: null },
  { id: 3, drive_id: "drv-003", run_started_at: "2024-04-06T08:10:00", run_completed_at: "2024-04-06T08:25:12", status: "succeeded" as const, stats_json: { items_synced: 1245, items_added: 45, items_modified: 32 }, error_message: null },
  { id: 4, drive_id: "drv-004", run_started_at: "2024-04-06T08:15:00", run_completed_at: null, status: "running" as const, stats_json: { items_synced: 120, items_added: 3, items_modified: 1 }, error_message: null },
  { id: 5, drive_id: "drv-005", run_started_at: "2024-04-06T07:00:00", run_completed_at: "2024-04-06T07:05:23", status: "failed" as const, stats_json: { items_synced: 0, items_added: 0, items_modified: 0 }, error_message: "Delta token expired, full sync required" },
];

export const mockSubjects = [
  { subject_id: 1, subject_type: "user" as const, aad_object_id: "aad-f1a2", display_name: "Priya Sharma" },
  { subject_id: 2, subject_type: "user" as const, aad_object_id: "aad-b3c4", display_name: "Rahul Mehta" },
  { subject_id: 3, subject_type: "group" as const, aad_object_id: "grp-fin-001", display_name: "Finance Team" },
  { subject_id: 4, subject_type: "link" as const, aad_object_id: null, display_name: "External Share Link" },
  { subject_id: 5, subject_type: "application" as const, aad_object_id: "app-backup-001", display_name: "Backup Service" },
];

// ── Derived data ──
export const STORAGE_GROWTH = [
  { month: "Oct", storage: 38 },
  { month: "Nov", storage: 42 },
  { month: "Dec", storage: 45 },
  { month: "Jan", storage: 50 },
  { month: "Feb", storage: 55 },
  { month: "Mar", storage: 60 },
  { month: "Apr", storage: 64 },
];

export const CATEGORY_DATA = [
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

// ── Helpers ──
export function formatSize(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

export function exportToCSV(headers: string[], rows: string[][], filename: string) {
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export const DRIVE_COLORS = ["hsl(217,91%,50%)", "hsl(262,83%,58%)", "hsl(142,71%,40%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)"];

export const tooltipStyle = { background: "#fff", border: "1px solid hsl(220,13%,91%)", borderRadius: 8, fontSize: 11, color: "#333" };
