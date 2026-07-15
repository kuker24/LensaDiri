-- Additive immutable-result provenance for modular module results.
-- Existing legacy and modular results remain readable; new modular writes populate both columns.

alter table public.result_modules
  add column item_bank_version text,
  add column composer_version text;

alter table public.result_modules
  add constraint result_modules_item_bank_version_not_blank check (
    item_bank_version is null or length(btrim(item_bank_version)) > 0
  ),
  add constraint result_modules_composer_version_not_blank check (
    composer_version is null or length(btrim(composer_version)) > 0
  );
