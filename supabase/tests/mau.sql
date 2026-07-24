BEGIN;
SELECT plan(4);

SELECT has_column('public','dm_dac_tinh','mau');
SELECT col_type_is('public','dm_dac_tinh','mau','text');
SELECT has_column('public','dm_loai_thiet_bi','mau');
SELECT col_type_is('public','dm_loai_thiet_bi','mau','text');

SELECT * FROM finish();
ROLLBACK;
