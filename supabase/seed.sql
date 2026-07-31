-- Synthetic prototype data only. Create Auth users separately; see README.
insert into public.issue_categories
  (code, name, default_stage, ownership, requires_comment, active, display_order)
values
  ('EXCESS_CARBON', 'Excess carbon', 'pressing', 'potrooms', false, true, 10),
  ('EXCESS_ALUMINIUM', 'Excess aluminium', 'pressing', 'potrooms', false, true, 20),
  ('UNDERWEIGHT', 'Sample size underweight', 'pressing', 'potrooms', false, true, 30),
  ('LAB_EQUIPMENT', 'Lab equipment', null, 'equipment', false, true, 40),
  ('LAB_HANDLING', 'Lab handling error', null, 'laboratory', false, true, 50),
  ('TOO_CRUMBLY', 'Too crumbly for X-ray analysis', 'xray_analysis', 'potrooms', false, true, 60),
  ('OTHER', 'Other', null, 'unclassified', true, true, 70)
on conflict (code) do update set
  name = excluded.name, default_stage = excluded.default_stage,
  ownership = excluded.ownership, requires_comment = excluded.requires_comment,
  active = excluded.active, display_order = excluded.display_order;

insert into public.trays (id, tray_code, tray_name, source)
values ('10000000-0000-4000-8000-000000000001', 'FLUX-TEST-001', '2001 - 2021', 'Pot cells')
on conflict (tray_code) do update set tray_name = excluded.tray_name, source = excluded.source;

insert into public.samples (tray_id, sample_number, pot_cell_number)
select
  '10000000-0000-4000-8000-000000000001',
  sample_no::text,
  sample_no
from generate_series(2001, 2021) as sample_no
on conflict (tray_id, sample_number) do nothing;
