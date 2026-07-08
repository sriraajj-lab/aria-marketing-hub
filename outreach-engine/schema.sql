-- =============================================================
-- outreach-engine — SQLite schema
-- Single-file database: data/outreach.db
-- Apply with: sqlite3 data/outreach.db < schema.sql
-- Idempotent: safe to re-run (CREATE IF NOT EXISTS everywhere).
-- =============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- -------------------------------------------------------------
-- products — active product profiles (mirror of product-profiles/*.json)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    product_id    TEXT PRIMARY KEY,              -- e.g. 'denials-doctor'
    product_name  TEXT NOT NULL,
    profile_path  TEXT NOT NULL,                 -- relative path to the JSON profile
    active        INTEGER NOT NULL DEFAULT 0,    -- 1 = currently selected product
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -------------------------------------------------------------
-- campaigns — outreach campaigns linked to products
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id      TEXT NOT NULL REFERENCES products(product_id),
    name            TEXT NOT NULL,
    sequence_length INTEGER NOT NULL DEFAULT 4,  -- number of emails in the sequence
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','paused','archived')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -------------------------------------------------------------
-- leads — raw leads from all sources
-- Pipeline stages: new -> enriched -> scored -> outreach_sent
--                  -> replied -> meeting_booked -> won | lost
-- 'duplicate' is terminal for deduped rows (source data preserved
-- in lead_sources against the surviving lead).
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id    TEXT NOT NULL REFERENCES products(product_id),
    source        TEXT NOT NULL
                  CHECK (source IN ('npi','indeed','ziprecruiter','linkedin-jobs',
                                    'maps','intent-x','intent-reddit','apollo','manual')),
    company_name  TEXT NOT NULL,
    domain        TEXT NOT NULL DEFAULT '',      -- normalized website domain, '' if unknown
    contact_name  TEXT NOT NULL DEFAULT '',
    title         TEXT NOT NULL DEFAULT '',      -- contact's role/title if known
    specialty     TEXT NOT NULL DEFAULT '',      -- medical specialty (NPI source)
    npi_number    TEXT NOT NULL DEFAULT '',
    email         TEXT NOT NULL DEFAULT '',
    phone         TEXT NOT NULL DEFAULT '',
    address       TEXT NOT NULL DEFAULT '',
    city          TEXT NOT NULL DEFAULT '',
    state         TEXT NOT NULL DEFAULT '',
    website       TEXT NOT NULL DEFAULT '',
    pain_signal   TEXT NOT NULL DEFAULT '',      -- the specific evidence (job snippet, review quote, post text)
    raw_json      TEXT NOT NULL DEFAULT '{}',    -- full source payload
    score         INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 10),
    status        TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','enriched','scored','outreach_sent',
                                    'replied','meeting_booked','won','lost',
                                    'duplicate','unsubscribed')),
    dedupe_key    TEXT NOT NULL,                 -- normalized company_name + '|' + domain
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_dedupe   ON leads(dedupe_key);
CREATE INDEX IF NOT EXISTS idx_leads_status   ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score    ON leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_source   ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_product  ON leads(product_id);
CREATE INDEX IF NOT EXISTS idx_leads_created  ON leads(created_at);

-- -------------------------------------------------------------
-- lead_sources — every raw sighting of a lead, including duplicates.
-- "Store ALL source data even for duplicates."
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_sources (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    source     TEXT NOT NULL,
    raw_json   TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lead_sources_lead ON lead_sources(lead_id);

-- -------------------------------------------------------------
-- contacts — enriched contact info (email, phone, LinkedIn)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id        INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    name           TEXT NOT NULL DEFAULT '',
    title          TEXT NOT NULL DEFAULT '',
    email          TEXT NOT NULL DEFAULT '',
    email_verified INTEGER NOT NULL DEFAULT 0,   -- 1 when the enrichment source verified it
    phone          TEXT NOT NULL DEFAULT '',
    linkedin_url   TEXT NOT NULL DEFAULT '',
    source         TEXT NOT NULL DEFAULT 'apollo',
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contacts_lead  ON contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- -------------------------------------------------------------
-- outreach — every touchpoint (email sent, call made, DM sent)
-- Human-in-the-loop: rows are 'queued' until approved; nothing
-- sends from 'queued'. auto_approved=1 only when the skill is at
-- the "auto" trust tier.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outreach (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id       INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    contact_id    INTEGER REFERENCES contacts(id),
    campaign_id   INTEGER REFERENCES campaigns(id),
    channel       TEXT NOT NULL CHECK (channel IN ('email','call','linkedin')),
    sequence_step INTEGER NOT NULL DEFAULT 1,    -- which email in the sequence (1-4)
    template_id   TEXT NOT NULL DEFAULT '',      -- e.g. 'denials-doctor-email-1'
    subject       TEXT NOT NULL DEFAULT '',
    body          TEXT NOT NULL DEFAULT '',
    from_email    TEXT NOT NULL DEFAULT '',
    from_domain   TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','approved','sent','failed','cancelled')),
    auto_approved INTEGER NOT NULL DEFAULT 0,
    external_id   TEXT NOT NULL DEFAULT '',      -- Resend message id / Vapi call id
    error         TEXT NOT NULL DEFAULT '',
    sent_at       TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_outreach_lead    ON outreach(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_status  ON outreach(status);
CREATE INDEX IF NOT EXISTS idx_outreach_channel ON outreach(channel);
CREATE INDEX IF NOT EXISTS idx_outreach_sent_at ON outreach(sent_at);
CREATE INDEX IF NOT EXISTS idx_outreach_domain  ON outreach(from_domain);

-- -------------------------------------------------------------
-- replies — parsed replies with sentiment
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS replies (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    outreach_id INTEGER REFERENCES outreach(id),
    lead_id     INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    channel     TEXT NOT NULL DEFAULT 'email',
    body        TEXT NOT NULL DEFAULT '',
    sentiment   TEXT NOT NULL DEFAULT 'other'
                CHECK (sentiment IN ('interested','not_interested','wrong_person',
                                     'unsubscribe','other')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_replies_lead      ON replies(lead_id);
CREATE INDEX IF NOT EXISTS idx_replies_sentiment ON replies(sentiment);
CREATE INDEX IF NOT EXISTS idx_replies_created   ON replies(created_at);

-- -------------------------------------------------------------
-- meetings — booked meetings
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meetings (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id        INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    scheduled_at   TEXT NOT NULL,                -- ISO 8601
    calendar_link  TEXT NOT NULL DEFAULT '',
    source_channel TEXT NOT NULL DEFAULT 'email' CHECK (source_channel IN ('email','call','linkedin')),
    status         TEXT NOT NULL DEFAULT 'booked'
                   CHECK (status IN ('booked','completed','no_show','cancelled')),
    notes          TEXT NOT NULL DEFAULT '',
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_meetings_lead ON meetings(lead_id);

-- -------------------------------------------------------------
-- unsubscribes — CAN-SPAM suppression list. Checked before every send.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS unsubscribes (
    email      TEXT PRIMARY KEY,
    lead_id    INTEGER REFERENCES leads(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -------------------------------------------------------------
-- domain_warming — per-domain daily send allowance.
-- Start at 5/day, +5/day until the 50/day ceiling.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS domain_warming (
    domain        TEXT PRIMARY KEY,
    started_on    TEXT NOT NULL DEFAULT (date('now')),
    daily_ceiling INTEGER NOT NULL DEFAULT 50
);

-- -------------------------------------------------------------
-- Seed data
-- -------------------------------------------------------------
INSERT OR IGNORE INTO products (product_id, product_name, profile_path, active) VALUES
    ('denials-doctor',   'Denials Doctor',   'product-profiles/denials-doctor.json',   1),
    ('aria-agent-agency','Aria Agent Agency','product-profiles/aria-agent-agency.json',0),
    ('dharma-solutions', 'Dharma Solutions', 'product-profiles/dharma-solutions.json', 0);

INSERT OR IGNORE INTO campaigns (id, product_id, name, sequence_length, status) VALUES
    (1, 'denials-doctor',    'DD launch — RCM pain, US practices', 4, 'active'),
    (2, 'aria-agent-agency', 'Aria launch — ops automation',       4, 'active'),
    (3, 'dharma-solutions',  'Dharma launch — RCM outsourcing',    4, 'active');

INSERT OR IGNORE INTO domain_warming (domain, started_on, daily_ceiling) VALUES
    ('denialsdoctor.com',  date('now'), 50),
    ('ariaagent.agency',   date('now'), 50);
