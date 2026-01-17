-- CONTRACT BUILDER MODULE MIGRATION
-- Phase 1: Database Foundation

-- 1. Create `contract_snippets` (Atoms)
CREATE TABLE IF NOT EXISTS public.contract_snippets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- HTML or Markdown content
    category TEXT DEFAULT 'General', -- e.g., 'AV Control', 'Network', 'Legal'
    is_default BOOLEAN DEFAULT false, -- If true, it appears in the default library
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create `contract_templates` (Molecules)
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    structure JSONB DEFAULT '[]'::jsonb, -- Array of snippet_ids to load by default
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update `contracts` (Compounds) to support atomic structure
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS content_structure JSONB DEFAULT '[]'::jsonb; 
-- Stores array of { id, title, content } objects. 
-- This is a DEEP COPY of the snippets.

-- 4. Enable RLS
ALTER TABLE public.contract_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/manage snippets
CREATE POLICY "Auth users can view snippets" ON public.contract_snippets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can manage snippets" ON public.contract_snippets FOR ALL TO authenticated USING (true);

CREATE POLICY "Auth users can view templates" ON public.contract_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can manage templates" ON public.contract_templates FOR ALL TO authenticated USING (true);

-- 5. Seed Initial AV Snippets (Examples)
INSERT INTO public.contract_snippets (title, category, is_default, content) VALUES
('Scope of Work - Network', 'Network', true, '<h3>Network Scope</h3><p>Includes installation and configuration of a robust Unifi-based network infrastructure...</p>'),
('Scope of Work - Lighting', 'Lighting', true, '<h3>Lutron Lighting Control</h3><p>Implementation of a centralized Lutron Homeworks QSX processor...</p>'),
('SLA - Gold', 'SLA', true, '<h3>Gold Service Level Agreement</h3><ul><li>24/7 Remote Support</li><li>4-Hour On-site Response</li><li>Quarterly Preventative Maintenance</li></ul>'),
('Standard Payment Terms', 'Financial', true, '<h3>Payment Schedule</h3><p>50% Deposit upon signing.<br>40% Upon equipment delivery.<br>10% Upon final commissioning.</p>');
