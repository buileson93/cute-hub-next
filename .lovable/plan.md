# Plan: Spare Part System Compatibility Upgrade

Upgrade the "Vật tư dự phòng" (Spare Parts) feature to clearly define which systems a spare part can replace, supporting many-to-many relationships and user-defined evaluations.

## 1. Database Schema
Create a new relationship table to store compatibility links between assets (spare parts) and systems.

- **Table**: `public.thiet_bi_he_thong_tuong_thich`
- **Columns**:
  - `id` (UUID, PK)
  - `thiet_bi_id` (UUID, FK to `thiet_bi`, NOT NULL)
  - `he_thong_id` (UUID, FK to `dm_he_thong`, NOT NULL)
  - `phan_loai` (TEXT) - e.g., "Thay thế trực tiếp", "Dự phòng phụ"
  - `danh_gia` (TEXT) - User evaluation/notes on compatibility
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Security**:
  - Enable RLS.
  - GRANT SELECT, INSERT, UPDATE, DELETE to `authenticated`.
  - GRANT ALL to `service_role`.
  - Policy: Allow authenticated users to manage links.

## 2. Asset Management (Spare Part Side)
Enhance the equipment form to manage compatibility links.

- **`ThietBiFormDialog.tsx`**:
  - Extend the form to include a "Compatible Systems" manager.
  - Users can select multiple systems from `dm_he_thong`.
  - For each link, users can provide a classification and evaluation note.
- **`ThietBiDetailDrawer.tsx`**:
  - Add a "Compatibility" section showing the list of systems this asset can replace.

## 3. System View (Operation Side)
Cross-reference spare parts in the system detail view.

- **`src/routes/_app.he-thong.$id.tsx`**:
  - Add a new tab: "Vật tư dự phòng" (Spare Parts).
  - This tab queries and displays all `thiet_bi` linked to this system via `thiet_bi_he_thong_tuong_thich`.
  - Show status of the spare parts (available in stock vs. deployed elsewhere).

## 4. Discovery & Filtering
- Add a filter in the main asset list (`src/routes/_app.danh-muc.thiet-bi.tsx`) to find spare parts by "Compatible System".
- Update hover cards to show a quick summary of compatibility.

## Implementation Steps
1. Run migration to create `thiet_bi_he_thong_tuong_thich`.
2. Create `CompatibilityManager` component for the asset form.
3. Integrate `CompatibilityManager` into `ThietBiFormDialog`.
4. Update `ThietBiDetailDrawer` to display the new links.
5. Add the "Spare Parts" tab to the system detail page.
6. Verify grants and RLS.
