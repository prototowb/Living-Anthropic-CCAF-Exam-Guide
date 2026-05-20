// Tutor researcher tool barrel — Scenario 4 v0.2.
//
// Three granular tools over the in-browser source index, MCP-grade specs for
// v0.3's model-driven dispatch (when `adapter.capabilities.nativeToolUse` is
// true). Today the codebaseResearcher subagent calls them imperatively.

export {
  readSourceFile,
  readSourceFileSpec,
  type ReadSourceFileInput,
  type ReadSourceFileResult,
} from './readSourceFile';

export {
  grepSource,
  grepSourceSpec,
  type GrepSourceInput,
  type GrepSourceResult,
} from './grepSource';

export {
  globPaths,
  globPathsSpec,
  type GlobPathsInput,
  type GlobPathsResult,
} from './globPaths';

export {
  searchSymbol,
  searchSymbolSpec,
  type SearchSymbolInput,
  type SearchSymbolResult,
  type SymbolKind,
  type SymbolMatch,
} from './searchSymbol';

export {
  listPaths,
  getFile,
  indexedFileCount,
  indexedByteSize,
  type SourceFile,
} from './sourceIndex';

// Convenience aggregate for the registry / under-the-hood diagnostics.
import { readSourceFileSpec } from './readSourceFile';
import { grepSourceSpec } from './grepSource';
import { globPathsSpec } from './globPaths';
import { searchSymbolSpec } from './searchSymbol';
export const tutorResearcherTools = [
  readSourceFileSpec,
  grepSourceSpec,
  globPathsSpec,
  searchSymbolSpec,
] as const;
