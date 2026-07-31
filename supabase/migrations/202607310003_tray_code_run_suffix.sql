begin;

-- Leave five characters for the generated -R001 run suffix. This keeps every
-- run identifier inside the existing 40-character tray code constraint.
alter table public.tray_templates
  drop constraint if exists tray_templates_tray_code_check;
alter table public.tray_templates
  add constraint tray_templates_tray_code_check
  check (tray_code ~ '^[A-Z0-9-]{3,35}$');

commit;
