PRAGMA foreign_keys = ON;
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE coffees (
    coffee_id TEXT PRIMARY KEY,
    source_product_id TEXT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    country_code TEXT,
    region TEXT,
    variety TEXT,
    processing TEXT,
    harvest TEXT,
    flavor TEXT,
    recipe_status TEXT NOT NULL,
    record_json TEXT NOT NULL
);
CREATE TABLE recipes (
    recipe_id TEXT PRIMARY KEY,
    coffee_id TEXT NOT NULL REFERENCES coffees(coffee_id),
    source_recipe_id TEXT,
    program_fingerprint TEXT NOT NULL,
    coffee_g REAL CHECK (coffee_g > 0),
    water_g REAL CHECK (water_g > 0),
    temperature_c REAL CHECK (temperature_c > 0),
    duration_seconds INTEGER CHECK (duration_seconds > 0),
    water_to_coffee_ratio REAL,
    grinder_id TEXT,
    grind_setting_display TEXT,
    beverage_tds_percent REAL,
    scalar_targets_usable INTEGER NOT NULL CHECK (scalar_targets_usable IN (0, 1)),
    schedule_usable INTEGER NOT NULL CHECK (schedule_usable IN (0, 1)),
    record_json TEXT NOT NULL
);
CREATE INDEX recipes_coffee ON recipes(coffee_id);
CREATE TABLE steps (
    recipe_id TEXT NOT NULL REFERENCES recipes(recipe_id),
    step_index INTEGER NOT NULL,
    source_seq_num INTEGER,
    instruction TEXT,
    water_g REAL,
    cumulative_water_g REAL,
    temperature_c REAL,
    start_seconds INTEGER,
    stop_seconds INTEGER,
    record_json TEXT NOT NULL,
    PRIMARY KEY (recipe_id, step_index)
);
-- Candidate labels only; this does not claim that a model has been trained or evaluated.
CREATE VIEW scalar_training_candidates AS
SELECT c.coffee_id AS split_group, c.name, c.country_code, c.region, c.variety,
       c.processing, c.harvest, c.flavor, r.recipe_id, r.program_fingerprint,
       r.coffee_g, r.water_g, r.temperature_c, r.duration_seconds,
       r.water_to_coffee_ratio, r.grinder_id, r.grind_setting_display
FROM coffees c JOIN recipes r USING (coffee_id)
WHERE r.scalar_targets_usable = 1 AND r.schedule_usable = 1
      AND c.recipe_status = 'has_pourover';
