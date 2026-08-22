# Plan - Investigation & Resolution of Technical Doubts (N49-N54)

This plan addresses the technical investigations (N49-N54) and their implications for Task T43 and T44.

## Phase 1: Documentation & Clarification (Current Task)

- [ ] Create `mem://features/investigation-n49-n54.md` to store the findings from the audit.
- [ ] Answer the specific questions posed by the user (N49-N54) based on the audit.

## Phase 2: Actionable Fixes Based on Audit

- [ ] **N49 (T43 Step 3 Blocking)**: Since `validate_thiet_bi_he_thong_khi_lap` only "auto-fills" `he_thong_id` and doesn't validate, we can proceed with the UNIQUE index on `gan_chuc_nang` as long as we clean up the 4 duplicates found earlier. The function is safe to leave as-is for now, but should eventually be upgraded to a real validator.
- [ ] **N50 (gan_linh_kien audit)**: Confirm that no further action is needed for `gan_linh_kien` as it already has the required unique indexes (`uq_glk_khe_active`, `uq_glk_linh_kien_active`).
- [ ] **N52 (Orphaned Assets)**: With only 2 orphaned assets (assets with `he_thong_id` but no `gan_chuc_nang` position), T44 (Inventory/Asset sync) can proceed with a simple cleanup/mapping script rather than a complex recovery tool.
- [ ] **N53 (yeu_cau_gan_slot)**: Propose adding a UI check in `AssetPicker` or `ThanhPhanChiTietDialog` to enforce this flag if the user confirms it should be active.

## Phase 3: Resume T43 & T44

- [ ] Finalize T43 (Unique index for `gan_chuc_nang`).
- [ ] Proceed to T44 (Connecting Inventory and Assets).
