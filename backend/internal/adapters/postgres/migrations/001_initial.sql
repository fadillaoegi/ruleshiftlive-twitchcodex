CREATE TABLE IF NOT EXISTS proposals (
    id text PRIMARY KEY,
    message_id text NOT NULL,
    source text NOT NULL CHECK (source = 'twitch'),
    viewer_id text NOT NULL,
    author text NOT NULL,
    body text NOT NULL CHECK (length(body) <= 500),
    status text NOT NULL CHECK (status IN ('pending','unsupported','approved','vetoed','used')),
    rule jsonb,
    reason text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL,
    UNIQUE (source, message_id),
    CHECK ((status IN ('unsupported','vetoed')) OR rule IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS proposals_viewer_time ON proposals(source, viewer_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS one_approved_proposal ON proposals ((true)) WHERE status = 'approved';
CREATE TABLE IF NOT EXISTS rounds (
    id text PRIMARY KEY,
    proposal_id text NOT NULL REFERENCES proposals(id),
    author text NOT NULL,
    source text NOT NULL CHECK (source = 'twitch'),
    rule jsonb NOT NULL,
    status text NOT NULL CHECK (status IN ('running','finished','stopped')),
    started_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL CHECK (ends_at > started_at),
    coins integer NOT NULL DEFAULT 0 CHECK (coins >= 0),
    sequence integer NOT NULL DEFAULT 0 CHECK (sequence >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_running_round ON rounds ((true)) WHERE status = 'running';
