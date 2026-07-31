begin;

create index if not exists trays_processing_date_idx
  on public.trays(processing_date desc);
create index if not exists sample_issues_reported_at_idx
  on public.sample_issues(reported_at desc);

commit;
