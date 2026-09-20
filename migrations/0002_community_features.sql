CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('recommend', 'report')),
  company_name TEXT NOT NULL CHECK (length(company_name) BETWEEN 1 AND 120),
  parent_company TEXT NOT NULL DEFAULT '' CHECK (length(parent_company) <= 160),
  work_policy TEXT NOT NULL CHECK (work_policy IN ('strict_double', 'alternate', 'single', 'unknown')),
  evidence TEXT NOT NULL DEFAULT '' CHECK (length(evidence) <= 2000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE community_posts (
  id TEXT PRIMARY KEY,
  author_alias TEXT NOT NULL CHECK (length(author_alias) BETWEEN 1 AND 40),
  author_role TEXT NOT NULL DEFAULT '' CHECK (length(author_role) <= 60),
  target_company TEXT NOT NULL CHECK (length(target_company) BETWEEN 1 AND 120),
  category TEXT NOT NULL CHECK (category IN ('avoid_trap', 'recommend_wlb', 'ask_intel')),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 4 AND 140),
  content TEXT NOT NULL CHECK (length(content) BETWEEN 10 AND 4000),
  evidence_badge TEXT NOT NULL DEFAULT '' CHECK (length(evidence_badge) <= 120),
  upvotes INTEGER NOT NULL DEFAULT 0 CHECK (upvotes >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE community_replies (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_alias TEXT NOT NULL CHECK (length(author_alias) BETWEEN 1 AND 40),
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 1000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE community_post_votes (
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  visitor_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (post_id, visitor_hash)
);

CREATE TABLE brand_votes (
  company_id TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (company_id, visitor_hash)
);

CREATE TABLE employee_reports (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (length(role) BETWEEN 1 AND 60),
  weekend_rating INTEGER NOT NULL CHECK (weekend_rating BETWEEN 0 AND 100),
  off_work_time TEXT NOT NULL CHECK (off_work_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  statutory_pay INTEGER NOT NULL CHECK (statutory_pay IN (0, 1)),
  comment TEXT NOT NULL DEFAULT '' CHECK (length(comment) <= 1000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE purchase_pledges (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents BETWEEN 1 AND 100000000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_posts_category_created ON community_posts(category, created_at DESC);
CREATE INDEX idx_replies_post_created ON community_replies(post_id, created_at);
CREATE INDEX idx_brand_votes_company ON brand_votes(company_id, vote_type);
CREATE INDEX idx_employee_reports_company ON employee_reports(company_id, created_at DESC);
CREATE INDEX idx_purchase_pledges_created ON purchase_pledges(created_at DESC);

INSERT INTO community_posts
  (id, author_alias, author_role, target_company, category, title, content, evidence_badge, upvotes, created_at)
VALUES
  ('post-1', '离职应届生 #3901', '常州星宇前员工', '常州星宇股份', 'avoid_trap', '四百名应届生优化事件始末：违法成本低是核心', '刚入职就遭遇单方辞退，通报虽然出了，但社保一交应届生身份真没了。大家买车灯、汽车配件时请认准正规守约企业。', '公开报道线索', 4280, '2026-09-08T12:00:00.000Z'),
  ('post-2', '外企数码民工 #0294', '前国内高压大厂，现外企研发', 'Logitech（罗技）', 'recommend_wlb', '从高压大厂跳到外企外设厂后的工时体验', '之前每天熬到夜里十一点，周末随时响应。换工作后可以按日历安排协作，通常能准点下班。欢迎更多员工补充可核验经历。', '员工经历待交叉核验', 2150, '2026-09-07T12:00:00.000Z'),
  ('post-3', '准备装修的社畜 #1024', '消费者', '家居制造行业', 'ask_intel', '买家具想避开长期单休工厂，有业内员工分享吗？', '最近在挑选家具，希望了解不同品牌在工厂和门店岗位的真实排班、加班费和休息制度。', '求证中', 960, '2026-09-04T12:00:00.000Z');

INSERT INTO community_replies (id, post_id, author_alias, content, created_at)
VALUES
  ('rep-1-1', 'post-1', '汽车工程打工人', '建议继续补充可公开核验的通知、仲裁文书或监管信息。', '2026-09-08T20:15:00.000Z'),
  ('rep-2-1', 'post-2', '数码行业从业者', '不同团队可能差异很大，面试时最好确认加班审批和调休兑现方式。', '2026-09-07T22:40:00.000Z'),
  ('rep-3-1', 'post-3', '家居供应链员工', '总部职能和一线生产不能混为一谈，建议按具体基地与岗位收集信息。', '2026-09-04T19:45:00.000Z');
