-- Fix appointment timestamp columns to use TIMESTAMPTZ
-- This ensures UTC times are stored correctly without timezone conversion

-- Change requested_time from TIMESTAMP to TIMESTAMPTZ
ALTER TABLE appointments 
  ALTER COLUMN requested_time TYPE TIMESTAMPTZ USING requested_time AT TIME ZONE 'UTC';

-- Change proposed_time from TIMESTAMP to TIMESTAMPTZ
ALTER TABLE appointments 
  ALTER COLUMN proposed_time TYPE TIMESTAMPTZ USING proposed_time AT TIME ZONE 'UTC';

-- Change created_at and updated_at as well for consistency
ALTER TABLE appointments 
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

ALTER TABLE appointments 
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Note: This assumes existing data was meant to be UTC
-- If existing appointments have wrong times, you may need to adjust them manually
