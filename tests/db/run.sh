#!/usr/bin/env bash
# Runs supabase/setup.sql twice (it must be re-runnable) and every test file against a throwaway PostgreSQL database.
# Needs psql and a PostgreSQL 15+ server: PGHOST/PGPORT/PGUSER as usual (CI uses a postgres service container).
set -euo pipefail
cd "$(dirname "$0")"
DB=${TEST_DB:-raff_test}
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
run() { psql -q -v ON_ERROR_STOP=1 -d "$DB" "$@"; }
run -f 00-supabase-stub.sql
run -f ../../supabase/setup.sql 2>&1 | grep -v NOTICE || true
run -f ../../supabase/setup.sql 2>&1 | grep -v NOTICE || true
fail=0
for f in [1-9]*.sql; do
  # every test file starts from a clean store
  psql -q -d postgres -c "drop database if exists ${DB}_t" -c "create database ${DB}_t"
  psql -q -v ON_ERROR_STOP=1 -d "${DB}_t" -f 00-supabase-stub.sql
  psql -q -v ON_ERROR_STOP=1 -d "${DB}_t" -f ../../supabase/setup.sql > /dev/null 2>&1
  out=$(psql -q -t -A -d "${DB}_t" -f "$f" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: //')
  echo "== $f"; echo "$out" | grep -v '^$'
  if echo "$out" | grep -qE 'ERROR|SHOULD FAIL'; then echo "!! $f FAILED"; fail=1; fi
done
psql -q -d postgres -c "drop database if exists ${DB}_t" -c "drop database if exists $DB"
[ $fail = 0 ] && echo "ALL DATABASE TESTS PASSED" || { echo "DATABASE TESTS FAILED"; exit 1; }
