-- Rename 'Open' status to 'OPEN-UNBILLED'
UPDATE contracts 
SET status = 'OPEN-UNBILLED' 
WHERE status = 'Open';
