-- Publish availability changes so the report updates live.
--
-- Subscribing with `postgres_changes` is not enough on its own: Postgres emits
-- nothing for a table that is not in the publication, so the client subscribes
-- successfully and then sits silent forever. That is exactly what happened —
-- the subscription shipped in plan 04 and never once fired.
--
-- RLS still applies per subscriber. `availability_read` grants select to every
-- authenticated session, so the band all see each other's changes and nobody
-- else sees anything.

alter publication supabase_realtime add table availability;
