---
name: Large-file rewrite strategy
description: How to safely extract large blocks from god-component files without leaving dangling dead code.
---

When a file needs 500+ lines removed (e.g., extracting god-component inline definitions to sub-component files):

**Preferred:** Use `write()` to rewrite the whole file from scratch when you have the full content available.

**If using `edit()`:** Replace only the start of the target block in `old_string` — the rest of the old content becomes orphaned below the new code. You must then delete the orphan with:
```bash
sed -i '<start_line>,<end_line>d' path/to/file.tsx
```
followed by a cleanup `edit()` for any remaining marker lines.

**Why:** The `edit()` tool replaces the matched region; anything that was AFTER the matched region in the original file remains in place even if logically it should be gone.

**How to apply:** Whenever the task is "replace renderStepContent / replace large switch / remove all inline helpers from a file", prefer a full `write()` of the cleaned file. Use `sed -i` as a fallback for orphaned blocks.
