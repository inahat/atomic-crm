-- Rename 'Proposed' to 'Proposal'
UPDATE contracts
SET status = 'Proposal'
WHERE status = 'Proposed';

-- Rename 'Proposed-Sent' to 'Proposal-Sent'
UPDATE contracts
SET status = 'Proposal-Sent'
WHERE status = 'Proposed-Sent';
