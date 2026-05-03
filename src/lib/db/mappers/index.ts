// ── Mapper Module ──────────────────────────────────────────────────────────
// Public API for workspace data export, import, and snapshot operations.

// Types
export type {
    ExportFormat,
    ExportMode,
    ExportOptions,
    ImportSource,
    ImportStrategy,
    WorklogSnapshot,
    BoardSnapshot,
    ImportResult,
} from './types';
export { EXPORT_VERSION } from './types';

// Extract (DB → Snapshot)
export { extractSnapshot } from './extract';

// Serialize (Snapshot → Files)
export { snapshotToSingleJson, snapshotToFolderJsonFiles } from './serialize-json';
export { ticketsToCsv, snapshotToSingleCsv, snapshotToFolderCsvFiles } from './serialize-csv';

// Deserialize (Files → Snapshot)
export { parseSnapshotFromSingleJson, parseSnapshotFromFolder } from './deserialize-json';
export { csvToTickets } from './deserialize-csv';

// Import (Snapshot → DB)
export { importSnapshot } from './import';

// File Operations (Full orchestration)
export { exportToFile } from './export-file';
export { importFromFile, importFromFolder } from './import-file';
