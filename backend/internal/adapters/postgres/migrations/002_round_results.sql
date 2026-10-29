ALTER TABLE rounds ADD COLUMN IF NOT EXISTS result_saved boolean NOT NULL DEFAULT false;
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS message_id text NOT NULL DEFAULT '';
UPDATE rounds AS r SET message_id = p.message_id
FROM proposals AS p WHERE r.proposal_id = p.id AND r.message_id = '';
