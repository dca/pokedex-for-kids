-- +goose Up
CREATE TABLE accounts (
    id               uuid PRIMARY KEY,
    is_guest         boolean     NOT NULL,
    username         text,
    username_lower   text UNIQUE,
    password_hash    text,
    rescue_code_hash text,
    failed_logins    int         NOT NULL DEFAULT 0,
    locked_until     timestamptz,
    last_seen_at     timestamptz NOT NULL DEFAULT now(),
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT registered_has_credentials CHECK (
        is_guest OR (username IS NOT NULL AND password_hash IS NOT NULL AND rescue_code_hash IS NOT NULL)
    )
);

CREATE TABLE sessions (
    token_hash bytea PRIMARY KEY,
    account_id uuid        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_account_idx ON sessions (account_id);

CREATE TABLE children (
    id              uuid PRIMARY KEY,
    account_id      uuid        NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    nickname        text        NOT NULL,
    avatar          text        NOT NULL,
    start_stage     text        NOT NULL CHECK (start_stage IN ('learn', 'spell', 'read')),
    partner_base_id int CHECK (partner_base_id IN (1, 4, 7)),
    xp              int         NOT NULL DEFAULT 0,
    correct_streak  int         NOT NULL DEFAULT 0,
    encounter_count int         NOT NULL DEFAULT 0,
    -- 上次結算時已開放的區域數，用來判斷「這次新開放了哪些區域」
    unlocked_count  int         NOT NULL DEFAULT 1,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX children_account_idx ON children (account_id, created_at);

CREATE TABLE encounters (
    id           uuid PRIMARY KEY,
    child_id     uuid        NOT NULL REFERENCES children (id) ON DELETE CASCADE,
    zone         text        NOT NULL,
    kind         text        NOT NULL CHECK (kind IN ('wild', 'gym')),
    pokemon_id   int         NOT NULL,
    questions    jsonb       NOT NULL,
    status       text        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
    stars        int,
    result       jsonb,
    created_at   timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);
CREATE INDEX encounters_child_status_idx ON encounters (child_id, status);

CREATE TABLE answers (
    encounter_id   uuid        NOT NULL REFERENCES encounters (id) ON DELETE CASCADE,
    question_index int         NOT NULL,
    item_ids       text[]      NOT NULL,
    wrong_count    int         NOT NULL CHECK (wrong_count BETWEEN 0 AND 2),
    duration_ms    int         NOT NULL,
    answered_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (encounter_id, question_index)
);

CREATE TABLE mastery (
    child_id      uuid        NOT NULL REFERENCES children (id) ON DELETE CASCADE,
    item_id       text        NOT NULL,
    level         int         NOT NULL,
    due_encounter int,
    due_at        timestamptz,
    last_seen_at  timestamptz NOT NULL,
    PRIMARY KEY (child_id, item_id)
);

CREATE TABLE caught (
    child_id        uuid        NOT NULL REFERENCES children (id) ON DELETE CASCADE,
    pokemon_id      int         NOT NULL,
    best_stars      int         NOT NULL CHECK (best_stars BETWEEN 1 AND 3),
    first_caught_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (child_id, pokemon_id)
);

CREATE TABLE badges (
    child_id  uuid        NOT NULL REFERENCES children (id) ON DELETE CASCADE,
    zone      text        NOT NULL,
    earned_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (child_id, zone)
);

-- +goose Down
DROP TABLE badges;
DROP TABLE caught;
DROP TABLE mastery;
DROP TABLE answers;
DROP TABLE encounters;
DROP TABLE children;
DROP TABLE sessions;
DROP TABLE accounts;
