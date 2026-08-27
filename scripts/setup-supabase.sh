#!/usr/bin/env bash
#
# One-shot remote setup for the Red Planet Groove Supabase project.
#
#   ./scripts/setup-supabase.sh <4-digit-passcode>
#
# Idempotent: safe to re-run. Requires `npx supabase login` to have been done
# once (or SUPABASE_ACCESS_TOKEN in the environment).
#
# The passcode never leaves this machine. Only a salted SHA-256 of it is stored
# as an edge function secret, and neither the hash nor the salt reaches the
# browser.

set -euo pipefail

PROJECT_REF="nwiszvzmvhygwxnqqgtz"
PASSCODE="${1:-}"

if [[ -z "$PASSCODE" ]]; then
  echo "usage: $0 <passcode>" >&2
  exit 64
fi

echo "==> Linking project $PROJECT_REF"
npx supabase link --project-ref "$PROJECT_REF"

echo "==> Pushing schema and RLS policies"
npx supabase db push

echo "==> Enabling anonymous sign-ins"
# The identity model is anonymous sessions; nothing works without this.
npx supabase config push || {
  echo "!! config push failed — enable it by hand:" >&2
  echo "   Authentication -> Providers -> Anonymous" >&2
}

echo "==> Setting the passcode secret"
SALT="$(openssl rand -hex 16)"
HASH="$(printf '%s' "${PASSCODE}${SALT}" | sha256sum | cut -d' ' -f1)"
npx supabase secrets set \
  "BAND_PASSCODE_SALT=${SALT}" \
  "BAND_PASSCODE_SHA256=${HASH}"

echo "==> Deploying the claim-member function"
npx supabase functions deploy claim-member

echo
echo "Done. Remaining manual step: put the anon key in .env.local"
echo "  Project Settings -> API -> anon public"
