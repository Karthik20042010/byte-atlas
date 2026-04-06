

## Plan: OneDrive Schema-Aligned Dashboard with White Theme

### Summary
Update the dashboard to reflect the real OneDrive database schema (items, drives, users, file_versions, blobs, permissions, subjects, sync_runs), add OneDrive-specific analytics views, and switch from dark to white/light theme.

### 1. Switch to Light/White Theme
**File: `src/index.css`**
- Replace all dark HSL values with light equivalents (white background, dark text, light gray cards, subtle borders)
- Update glass-card, chat bubble, gradient-text, and scrollbar styles for light mode
- Update chart tooltip styles inline in Index.tsx to use light backgrounds

### 2. Reshape Mock Data to Match DB Schema
**File: `src/pages/Index.tsx`**

Replace generic mock data with data structures that mirror the actual schema:

- **`mockDrives`** — array of drives with `drive_id`, `drive_type` (personal/shared), `site_id`, `owner_user_id`, `name`
- **`mockUsers`** — array with `user_id`, `aad_user_id`, `name`, `email`, `user_principal_name`
- **`mockItems`** — files with `item_id`, `drive_id`, `parent_id`, `name`, `path_display`, `item_type` (file/folder), `mime_type`, `size`, `created_by`, `created_at`, `last_modified_at`
- **`mockFileProperties`** — `item_id`, `mime_type`, `extension`, `checksum`
- **`mockFileVersions`** — `version_id`, `item_id`, `version_number`, `blob_id`, `created_by`, `is_current`
- **`mockBlobs`** — `blob_id`, `storage_path`, `size`, `checksum`
- **`mockPermissions`** — `permission_id`, `item_id`, `user_id`, `role` (read/write/owner)
- **`mockSyncRuns`** — `drive_id`, `status` (running/succeeded/failed), `run_started_at`, `stats_json`

Derive existing chart/table data from these mock objects (e.g., storage distribution computed from items, duplicates found by matching checksums across drives).

### 3. Add OneDrive-Specific Dashboard Sections
**File: `src/pages/Index.tsx`**

Add new sections after the existing KPI cards area:

- **Drives Overview** — Card grid showing each drive (personal vs shared), owner, file count, total size, last sync status
- **File Versions Panel** — Table showing files with multiple versions, version count, size delta between versions
- **Permissions & Sharing Analysis** — Breakdown of permission roles (read/write/owner), count of shared items, externally shared files
- **Sync Status Monitor** — Status cards for recent sync runs per drive with succeeded/failed/running indicators and timing info
- **User Activity** — Top users by file count and storage consumed

### 4. Update Existing Sections
- **KPI Cards**: Add "Total Drives", "File Versions", "Shared Files" KPIs; update values to derive from mock schema data
- **Storage Distribution**: Show breakdown by drive instead of generic "OneDrive" — e.g., "Personal Drive", "Team Site A", "Team Site B"
- **Duplicate Analysis**: Find duplicates using `checksum` matching from `file_properties` table, show which drives contain copies
- **File Search**: Add filters for drive, mime type, extension; show `path_display`, `drive_id`, `created_by` columns
- **Largest Files**: Include drive name, owner, last modified date, version count

### 5. Update AI Agent Responses
- Update `getAgentResponse` to return OneDrive-schema-aware answers (referencing drives, versions, permissions, sync status)
- Add new suggested prompts: "Show drives overview", "Files with most versions", "Shared files analysis", "Sync status", "Permission breakdown"

### 6. Update Chart Styling for Light Theme
- All Recharts `contentStyle` tooltip backgrounds changed to white with light gray borders
- Grid stroke colors updated to light gray
- Axis tick colors updated to dark gray
- Bar/line gradient colors kept vibrant for contrast on white

### Technical Notes
- All changes remain in `src/pages/Index.tsx` (single file) and `src/index.css`
- No backend connection (no connectors available) — schema-realistic mock data only
- Framer Motion animations preserved
- The schema file will be kept as reference but not copied into the project

