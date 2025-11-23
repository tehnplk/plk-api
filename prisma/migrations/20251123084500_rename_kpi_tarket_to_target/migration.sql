-- Migration: Rename kpi_tarket to kpi_target while preserving data
-- Step 1: Add the new column kpi_target
ALTER TABLE kpi_report ADD COLUMN kpi_target REAL;

-- Step 2: Copy data from old column to new column
UPDATE kpi_report SET kpi_target = kpi_tarket;

-- Step 3: Drop the old column
ALTER TABLE kpi_report DROP COLUMN kpi_tarket;