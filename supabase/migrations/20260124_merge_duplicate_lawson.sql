-- Fix duplicate Lawson Joseph contacts
-- Contact 171 has no phone number but has 85 messages
-- Contact 384 has phone number +447879898897 but only 7 messages
-- Solution: Move all messages from 171 to 384, then delete 171

-- Step 1: Update all messages from contact 171 to contact 384
UPDATE whatsapp_messages
SET contact_id = 384
WHERE contact_id = 171;

-- Step 2: Delete the duplicate contact 171
DELETE FROM contacts
WHERE id = 171;
