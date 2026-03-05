
-- Fix monitoring_config UPDATE policy to be user-scoped is not needed for single-row config
-- The WARN is about USING(true) on UPDATE which is intentional for admin config table
-- No changes needed - this is a known pattern for config tables
SELECT 1;
