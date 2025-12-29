-- Migration: Add Moloni invoice fields to reservas table
-- Date: 2025-12-29
-- Description: Track Moloni invoices for reservations

ALTER TABLE reservas ADD COLUMN moloni_document_id INTEGER;
ALTER TABLE reservas ADD COLUMN moloni_document_number TEXT;

-- Create index for faster lookups
CREATE INDEX idx_reservas_moloni_document ON reservas(moloni_document_id) WHERE moloni_document_id IS NOT NULL;

-- Comments
-- moloni_document_id: Moloni document ID (integer)
-- moloni_document_number: Formatted document number (e.g., "FT 2025/123")
