-- Inspect Contract 194
SELECT * FROM public.contracts WHERE id = 194;

-- Compare with "14 Chelsea Square" contract which is working
SELECT * FROM public.contracts WHERE contract_name LIKE '14 Chelsea Square%';
