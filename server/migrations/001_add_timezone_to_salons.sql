-- Migration: Add timezone column to salons table
-- Purpose: Store the timezone for each salon to ensure availability and appointments are displayed in the correct timezone

ALTER TABLE salons ADD COLUMN timezone VARCHAR(255) NOT NULL DEFAULT 'UTC';

-- Create an index for timezone queries (optional but good for performance)
CREATE INDEX idx_salons_timezone ON salons(timezone);
