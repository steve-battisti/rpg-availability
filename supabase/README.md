# Supabase setup

**Status: written, not yet run against a live project.** The SQL and the edge
function are unverified — no Supabase project existed at the time of writing.
Everything that *could* be checked locally has been (the seed matches the roster
constant, RLS is enabled on every table, no client write policy exists on
`members`), but the first `db push` is where the real verification happens.

## One-time setup

1. Create a project at supabase.com. Note the project ref.

2. **Enable anonymous sign-ins.** Authentication → Providers → Anonymous.
   Nothing works without this — it is the whole identity model.

3. Apply the schema:

```bash
npx supabase link --project-ref YOUR-PROJECT-REF
```

```bash
npx supabase db push
```

4. Choose the band passcode and store its hash as a secret. Pick any random
   salt; only the hash and the salt are ever stored, and neither reaches the
   browser.

```bash
SALT=$(openssl rand -hex 16); printf 'salt: %s\nhash: %s\n' "$SALT" "$(printf '%s' "1234$SALT" | sha256sum | cut -d' ' -f1)"
```

Replace `1234` with the real passcode, then set both values:

```bash
npx supabase secrets set BAND_PASSCODE_SALT=THE-SALT BAND_PASSCODE_SHA256=THE-HASH
```

5. Deploy the claim function:

```bash
npx supabase functions deploy claim-member
```

6. Copy `.env.example` to `.env.local` and fill in the project URL and anon key
   from Project Settings → API.

## How the permission model actually works

The browser holds an **anonymous** Supabase session. It is durable — this is the
"name in a cookie" the band asked for — but on its own it grants nothing.

Entering the band passcode calls `claim-member`, which verifies the passcode
**server-side** and writes that session's uid onto a row in `members`. From then
on, RLS compares `auth.uid()` to `members.claimed_by` on every write. A member
can write their own dates; the admin can write anyone's.

Two things follow that are easy to get wrong later:

- **Never check the passcode in the browser.** The bundle is public and the anon
  key ships inside it. A client-side check can be skipped by anyone who opens
  devtools, so it protects nothing and creates the false impression that it does.
- **Never add a client write policy on `members`.** There is deliberately none.
  If one appears, any anonymous session can claim any member, and the whole model
  collapses. `src/data/seed.test.ts` fails if one is added.

## The passcode is a speed bump, honestly described

Four digits is 10,000 guesses. The defences are: the function refuses after 8
failed attempts in 15 minutes, the URL is unlisted, and there are six known
users. That is proportionate for a band calendar and it is not proportionate for
anything else. The rate limit keys on the anonymous session id, which a
determined attacker can churn — tighten it to IP if it is ever actually abused.
