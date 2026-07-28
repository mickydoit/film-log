-- Rate limiting for the AI critique.
--
-- The film-critique Edge Function is publicly callable (verify_jwt false,
-- wildcard CORS), so anyone who finds the URL could exhaust the Groq free
-- tier. Enforcing here rather than in the browser is the only version that
-- cannot be bypassed.
--
-- Groq free tier on qwen/qwen3.6-27b, measured from the response headers on
-- 2026-07-28: 8000 tokens per minute, 1000 requests per day. One critique
-- costs roughly 2800 tokens, so the per-minute ceiling is the binding one.

create table if not exists public.film_critique_usage (
  day     date primary key,
  count   integer not null default 0,
  last_at timestamptz not null default now()
);

alter table public.film_critique_usage enable row level security;
-- No anon policy on purpose: only the Edge Function's service role touches
-- this, so the browser can neither read the counter nor forge it.

/**
 * Claim one critique slot for today, or explain why not.
 *
 * Takes a row lock so two simultaneous requests cannot both pass the check.
 * Returns { allowed, reason, wait, used, limit }.
 */
create or replace function public.film_critique_take_slot(
  p_daily_limit integer,
  p_min_seconds integer
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row  public.film_critique_usage%rowtype;
  v_wait numeric;
begin
  insert into public.film_critique_usage (day, count, last_at)
  values (current_date, 0, now() - make_interval(secs => p_min_seconds))
  on conflict (day) do nothing;

  select * into v_row
    from public.film_critique_usage
   where day = current_date
     for update;

  if v_row.count >= p_daily_limit then
    return json_build_object(
      'allowed', false, 'reason', 'daily',
      'used', v_row.count, 'limit', p_daily_limit);
  end if;

  v_wait := p_min_seconds - extract(epoch from (now() - v_row.last_at));
  if v_wait > 0 then
    return json_build_object(
      'allowed', false, 'reason', 'cooldown', 'wait', ceil(v_wait),
      'used', v_row.count, 'limit', p_daily_limit);
  end if;

  update public.film_critique_usage
     set count = count + 1, last_at = now()
   where day = current_date;

  return json_build_object(
    'allowed', true, 'used', v_row.count + 1, 'limit', p_daily_limit);
end;
$$;

-- Only the Edge Function may claim a slot. Revoking from public strips the
-- default grant from every role, so service_role must be granted back
-- explicitly — without this the function fails closed and refuses everything.
revoke all on function public.film_critique_take_slot(integer, integer)
  from public, anon, authenticated;
grant execute on function public.film_critique_take_slot(integer, integer)
  to service_role;
