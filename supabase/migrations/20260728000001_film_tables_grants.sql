-- Postgres table privileges are a separate layer from RLS. The film tables
-- had permissive RLS policies but no DML grants, so every request from the
-- browser failed with "permission denied for table film_rolls" — the app
-- could not read or write anything. Tables created through the dashboard get
-- these grants automatically; tables created by migration do not.
--
-- Scoped to the film_ tables only. film_critique_usage is deliberately
-- excluded: the quota counter must stay reachable only by the Edge
-- Function's service role, or a caller could reset their own budget.

grant select, insert, update, delete on public.film_rolls to anon, authenticated;
grant select, insert, update, delete on public.film_shots to anon, authenticated;
