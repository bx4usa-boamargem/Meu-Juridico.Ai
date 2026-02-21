

## Update Collapsed Sidebar Icon

### Problem
The collapsed sidebar currently shows the wrong icon. It should display the "J" mark (the uploaded icon) when the sidebar is collapsed.

### Changes

#### 1. Copy the new icon asset
Copy `user-uploads://image-12.png` to `src/assets/logo-icon.png`, replacing the current file.

#### 2. No code changes needed
The `AppSidebar.tsx` already imports `logo-icon.png` and renders it when collapsed with `brightness-0 invert`. Since the new icon is already white on transparent, the existing code will work correctly.

### Files affected
| Action | File |
|--------|------|
| Replace | `src/assets/logo-icon.png` |

