

## Fix Logo Assets

### Problem
The logo is not rendering correctly in the sidebar. The current SVG assets need to be replaced with the correct logo files provided by the user.

### Changes

#### 1. Replace logo assets
- Copy `user-uploads://image-10.png` to `src/assets/logo-full.png` (full logo: icon + "meu Juridico" text)
- Copy `user-uploads://image-11.png` to `src/assets/logo-icon.png` (same image used as icon-only fallback for collapsed state)

#### 2. Update `src/components/layout/AppSidebar.tsx`
- Change imports from `.svg` to `.png`:
  - `logo-icon.svg` -> `logo-icon.png`
  - `logo-full.svg` -> `logo-full.png`

#### 3. Update `src/pages/Auth.tsx`
- Change import from `logo-full.svg` to `logo-full.png`

No layout or functional changes. Only asset replacement.

