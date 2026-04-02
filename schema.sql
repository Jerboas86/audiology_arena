-- Schema definition for audiology_arena
-- Generated from src/lib/server/db/schema.ts

CREATE SCHEMA IF NOT EXISTS aud;

-- Enums
CREATE TYPE aud.lang_code AS ENUM (
    'fr-FR', 'en-US', 'en-GB', 'es-ES', 'de-DE', 'it-IT'
);

CREATE TYPE aud.elo_level AS ENUM (
    'voice', 'model', 'org'
);

-- Word lists
CREATE TABLE aud.word_lists (
    list_id         text PRIMARY KEY,
    list_name       varchar(100) NOT NULL,
    list_type       varchar(100) NOT NULL,
    list_number     integer NOT NULL,
    language        aud.lang_code NOT NULL,

    CONSTRAINT word_lists_list_name_list_number_language_key
        UNIQUE (list_name, list_number, language),
    CONSTRAINT list_name_is_lower_alpha
        CHECK (list_name ~ '[a-z]+'),
    CONSTRAINT list_type_is_lower_alpha
        CHECK (list_type ~ '[a-z]+'),
    CONSTRAINT non_negative_list_number
        CHECK (list_number >= 0)
);

-- Tokens
CREATE TABLE aud.tokens (
    token               text NOT NULL,
    list_id             text NOT NULL REFERENCES aud.word_lists(list_id) ON DELETE CASCADE,
    language            aud.lang_code NOT NULL,
    homonyms            text[] NOT NULL DEFAULT '{}',
    definite_article    text NOT NULL DEFAULT '',
    indefinite_article  text NOT NULL DEFAULT '',
    created_at          timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT tokens_pkey PRIMARY KEY (token, list_id, language)
);

-- Organisations
CREATE TABLE aud.organisations (
    slug        varchar(100) PRIMARY KEY,
    name        text NOT NULL,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT slug_is_kebab CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Models
CREATE TABLE aud.models (
    org_slug    varchar(100) NOT NULL REFERENCES aud.organisations(slug) ON DELETE CASCADE,
    name        varchar(100) NOT NULL,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT models_pkey PRIMARY KEY (org_slug, name)
);

-- Voices
CREATE TABLE aud.voices (
    org_slug    varchar(100) NOT NULL REFERENCES aud.organisations(slug) ON DELETE CASCADE,
    voice_id    text NOT NULL,
    voice_name  text NOT NULL,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT voices_pkey PRIMARY KEY (org_slug, voice_id)
);

-- Voice-language junction (a voice can support multiple languages)
CREATE TABLE aud.voice_languages (
    org_slug    varchar(100) NOT NULL,
    voice_id    text NOT NULL,
    language    aud.lang_code NOT NULL,

    CONSTRAINT voice_languages_pkey PRIMARY KEY (org_slug, voice_id, language),
    CONSTRAINT voice_languages_voice_fkey
        FOREIGN KEY (org_slug, voice_id) REFERENCES aud.voices(org_slug, voice_id) ON DELETE CASCADE
);

-- Model-voice junction
CREATE TABLE aud.model_voices (
    org_slug    varchar(100) NOT NULL,
    model_name  varchar(100) NOT NULL,
    voice_id    text NOT NULL,

    CONSTRAINT model_voices_pkey PRIMARY KEY (org_slug, model_name, voice_id),
    CONSTRAINT model_voices_model_fkey
        FOREIGN KEY (org_slug, model_name) REFERENCES aud.models(org_slug, name) ON DELETE CASCADE,
    CONSTRAINT model_voices_voice_fkey
        FOREIGN KEY (org_slug, voice_id) REFERENCES aud.voices(org_slug, voice_id) ON DELETE CASCADE
);

-- Comparisons
CREATE TABLE aud.comparisons (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token               text NOT NULL,
    list_id             text NOT NULL,
    language            aud.lang_code NOT NULL,
    org_slug_a          varchar(100) NOT NULL,
    model_name_a        varchar(100) NOT NULL,
    voice_id_a          text NOT NULL,
    org_slug_b          varchar(100) NOT NULL,
    model_name_b        varchar(100) NOT NULL,
    voice_id_b          text NOT NULL,
    winner_org_slug     varchar(100) NOT NULL,
    winner_model_name   varchar(100) NOT NULL,
    winner_voice_id     text NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT comparisons_side_a_fkey
        FOREIGN KEY (org_slug_a, model_name_a, voice_id_a)
        REFERENCES aud.model_voices(org_slug, model_name, voice_id) ON DELETE CASCADE,
    CONSTRAINT comparisons_side_b_fkey
        FOREIGN KEY (org_slug_b, model_name_b, voice_id_b)
        REFERENCES aud.model_voices(org_slug, model_name, voice_id) ON DELETE CASCADE,
    CONSTRAINT winner_is_a_or_b CHECK (
        (winner_org_slug, winner_model_name, winner_voice_id) = (org_slug_a, model_name_a, voice_id_a)
        OR
        (winner_org_slug, winner_model_name, winner_voice_id) = (org_slug_b, model_name_b, voice_id_b)
    )
);

CREATE INDEX idx_comparisons_side_a ON aud.comparisons (org_slug_a, model_name_a, voice_id_a);
CREATE INDEX idx_comparisons_side_b ON aud.comparisons (org_slug_b, model_name_b, voice_id_b);
CREATE INDEX idx_comparisons_winner_org ON aud.comparisons (winner_org_slug);
CREATE INDEX idx_comparisons_winner_model ON aud.comparisons (winner_org_slug, winner_model_name);
CREATE INDEX idx_comparisons_winner_voice ON aud.comparisons (winner_org_slug, winner_model_name, winner_voice_id);
CREATE INDEX idx_comparisons_created_at ON aud.comparisons (created_at);

-- ELO ratings: voice level
CREATE TABLE aud.elo_voice (
    org_slug        varchar(100) NOT NULL,
    model_name      varchar(100) NOT NULL,
    voice_id        text NOT NULL,
    language        aud.lang_code NOT NULL,
    rating          integer NOT NULL DEFAULT 1500,
    num_comparisons integer NOT NULL DEFAULT 0,
    num_wins        integer NOT NULL DEFAULT 0,
    num_losses      integer NOT NULL DEFAULT 0,
    updated_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT elo_voice_pkey PRIMARY KEY (org_slug, model_name, voice_id, language),
    CONSTRAINT elo_voice_model_voice_fkey
        FOREIGN KEY (org_slug, model_name, voice_id)
        REFERENCES aud.model_voices(org_slug, model_name, voice_id) ON DELETE CASCADE
);

CREATE INDEX idx_elo_voice_rating ON aud.elo_voice (language, rating);

-- ELO ratings: model level
CREATE TABLE aud.elo_model (
    org_slug        varchar(100) NOT NULL,
    model_name      varchar(100) NOT NULL,
    language        aud.lang_code NOT NULL,
    rating          integer NOT NULL DEFAULT 1500,
    num_comparisons integer NOT NULL DEFAULT 0,
    num_wins        integer NOT NULL DEFAULT 0,
    num_losses      integer NOT NULL DEFAULT 0,
    updated_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT elo_model_pkey PRIMARY KEY (org_slug, model_name, language),
    CONSTRAINT elo_model_model_fkey
        FOREIGN KEY (org_slug, model_name)
        REFERENCES aud.models(org_slug, name) ON DELETE CASCADE
);

CREATE INDEX idx_elo_model_rating ON aud.elo_model (language, rating);

-- ELO ratings: org level
CREATE TABLE aud.elo_org (
    org_slug        varchar(100) NOT NULL REFERENCES aud.organisations(slug) ON DELETE CASCADE,
    language        aud.lang_code NOT NULL,
    rating          integer NOT NULL DEFAULT 1500,
    num_comparisons integer NOT NULL DEFAULT 0,
    num_wins        integer NOT NULL DEFAULT 0,
    num_losses      integer NOT NULL DEFAULT 0,
    updated_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT elo_org_pkey PRIMARY KEY (org_slug, language)
);

CREATE INDEX idx_elo_org_rating ON aud.elo_org (language, rating);

-- ELO history
CREATE TABLE aud.elo_history (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    level           aud.elo_level NOT NULL,
    org_slug        varchar(100) NOT NULL,
    model_name      varchar(100),
    voice_id        text,
    language        aud.lang_code NOT NULL,
    rating          integer NOT NULL,
    comparison_id   uuid NOT NULL REFERENCES aud.comparisons(id) ON DELETE CASCADE,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_elo_history_entity ON aud.elo_history (level, org_slug, model_name, voice_id, language);
CREATE INDEX idx_elo_history_comparison ON aud.elo_history (comparison_id);
CREATE INDEX idx_elo_history_created_at ON aud.elo_history (created_at);

-- TTS jobs
CREATE TABLE aud.tts_jobs (
    token           text NOT NULL,
    list_id         text NOT NULL,
    language        aud.lang_code NOT NULL,
    org_slug        varchar(100) NOT NULL,
    model_name      varchar(100) NOT NULL,
    voice_id        text NOT NULL,
    status          varchar(20) NOT NULL DEFAULT 'pending',
    audio_uri       text,
    file_size_bytes integer,
    error_message   text,
    retry_count     integer NOT NULL DEFAULT 0,
    processed_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT tts_jobs_pkey PRIMARY KEY (token, list_id, language, org_slug, model_name, voice_id),
    CONSTRAINT tts_jobs_tokens_fkey
        FOREIGN KEY (token, list_id, language)
        REFERENCES aud.tokens(token, list_id, language) ON DELETE CASCADE,
    CONSTRAINT tts_jobs_model_voice_fkey
        FOREIGN KEY (org_slug, model_name, voice_id)
        REFERENCES aud.model_voices(org_slug, model_name, voice_id) ON DELETE CASCADE
);

CREATE INDEX idx_tts_jobs_status ON aud.tts_jobs (status);
CREATE INDEX idx_tts_jobs_language ON aud.tts_jobs (language);
CREATE INDEX idx_tts_jobs_created_at ON aud.tts_jobs (created_at);
CREATE INDEX idx_tts_jobs_model_voice ON aud.tts_jobs (org_slug, model_name, voice_id);
