# Connect to the existing PostgreSQL 18 container

The user selected their existing Docker PostgreSQL 18 instance. This project
connects to its published host port. It must not recreate that container, attach
a different volume, reset existing passwords or migrate another project's data.

## Find the existing instance

On a terminal with Docker access:

```sh
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
docker port YOUR_POSTGRES_CONTAINER 5432/tcp
```

Replace `YOUR_POSTGRES_CONTAINER` with the actual name. A mapping such as
`127.0.0.1:5435` means the backend host port is 5435, even though PostgreSQL
listens on 5432 inside the container. No mapping was observed by Codex: this
session's Docker socket access was denied.

Use the existing administrative database user to open `psql` inside that same
container:

```sh
docker exec -it YOUR_POSTGRES_CONTAINER psql -U YOUR_EXISTING_DB_USER -d postgres
```

Check the actual server version with `SHOW server_version;`. Container image
names alone are not version evidence. The backend and integration test check
the server's major version is 18 before making schema changes.

## One-time application databases

If this project's role/databases do not exist yet, create isolated resources
inside that server from the administrative `psql` session:

```sql
CREATE ROLE ruleshift_live LOGIN;
```

Use `\password ruleshift_live` at the `psql` prompt to set a private password
without putting its value in shell history. Then create the two databases:

```sql
CREATE DATABASE ruleshift_live OWNER ruleshift_live;
CREATE DATABASE ruleshift_live_test OWNER ruleshift_live;
```

If these resources already belong to this project, use their existing credentials.
Do not reset or take over a similarly named resource belonging to another app.

Set `DATABASE_URL` and `TEST_DATABASE_URL` in the ignored `backend/.env`, using
the real host port and URL-encoded credentials. The README shows their shapes.
Never send passwords in chat. These databases use the existing server's volume.

## Verify and run

From `ruleshift-live/`:

```sh
node scripts/doctor.mjs
node scripts/verify.mjs
node scripts/dev.mjs --live
```

Doctor reads metadata only and never migrates. Verification uses a temporary
schema in the `_test` database, then removes that schema. Application startup
runs the idempotent migration in the application database. No helper starts a
database container or contacts a paid service.

`compose.yaml` is an opt-in template for a fresh machine, under the explicit
`isolated-dev-db` profile and separate host port 55432. It is not part of this
existing-container setup. Its volume target follows the PostgreSQL 18 official
image's `/var/lib/postgresql` layout, documented by the
[official Docker image](https://hub.docker.com/_/postgres).

## Current verification limit

The user reports PostgreSQL 18 already exists in Docker. Codex's read-only
`docker ps` command was denied by the session sandbox, and localhost network
access was denied. Its name, port, database role, actual server version and
integration behavior therefore remain unverified. The observed preflight is
saved in `docs/evidence/environment.json` without credential values.
