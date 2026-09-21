CREATE TABLE moderation_queue (
  id TEXT PRIMARY KEY,
  submission_type TEXT NOT NULL CHECK (
    submission_type IN (
      'brand_vote',
      'employee_report',
      'purchase_pledge',
      'company_submission',
      'community_post',
      'community_reply',
      'community_vote'
    )
  ),
  target_key TEXT NOT NULL CHECK (length(target_key) BETWEEN 1 AND 180),
  payload_json TEXT NOT NULL CHECK (length(payload_json) BETWEEN 2 AND 8192),
  submitter_hash TEXT NOT NULL CHECK (length(submitter_hash) = 64),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_note TEXT NOT NULL DEFAULT '' CHECK (length(reviewer_note) <= 1000),
  published_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  reviewed_at TEXT
);

CREATE INDEX idx_moderation_queue_status_created
  ON moderation_queue(status, created_at DESC);

CREATE UNIQUE INDEX idx_moderation_queue_pending_source
  ON moderation_queue(submission_type, target_key, submitter_hash)
  WHERE status = 'pending';

CREATE TABLE moderation_audit_log (
  id TEXT PRIMARY KEY,
  queue_id TEXT NOT NULL REFERENCES moderation_queue(id) ON DELETE RESTRICT,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  reviewer_fingerprint TEXT NOT NULL CHECK (length(reviewer_fingerprint) = 16),
  note TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 1000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_moderation_audit_queue_created
  ON moderation_audit_log(queue_id, created_at DESC);

-- These rows were demo fixtures shipped by migration 0002, not user submissions.
DELETE FROM community_replies WHERE id IN ('rep-1-1', 'rep-2-1', 'rep-3-1');
DELETE FROM community_posts WHERE id IN ('post-1', 'post-2', 'post-3');
