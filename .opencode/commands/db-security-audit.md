---
description: Run a read-only security audit of Supabase/PostgreSQL access boundaries in OpenDayCare.
agent: db-security-auditor
---

Run the read-only Supabase/PostgreSQL security audit for this scope: $ARGUMENTS

Follow the agent's required OpenDayCare isolation checks. Audit and propose remediations only: do not edit files, execute DDL/DML, apply migrations, or change remote state. If no scope was supplied, audit the available Supabase schema, migrations, policies, and related application access paths; ask a focused question only if the target cannot be determined.
