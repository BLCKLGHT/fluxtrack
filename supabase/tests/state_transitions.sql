begin;
select plan(8);

select has_table('public', 'trays', 'trays table exists');
select has_table('public', 'sample_issues', 'sample issues table exists');
select has_function('public', 'log_tray_received', array['uuid', 'integer'], 'receive operation exists');
select has_function(
  'public', 'create_sample_issue',
  array['uuid','uuid','uuid','uuid','processing_stage','text','text','text','bigint','uuid'],
  'issue operation exists'
);
select has_function('public', 'complete_tray', array['uuid','integer'], 'complete operation exists');
select has_function('public', 'reopen_tray', array['uuid','text'], 'reopen operation exists');
select has_function('public', 'void_issue', array['uuid','text'], 'void operation exists');
select col_is_unique('public', 'sample_issues', 'idempotency_key', 'idempotency keys are unique');

select * from finish();
rollback;
