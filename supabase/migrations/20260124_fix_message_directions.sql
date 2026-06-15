-- Fix incorrect message directions in existing data
-- Messages where sender is the channel number should be outbound
-- Messages where receiver is the channel number should be inbound

-- Get the channel number from environment (hardcoded for this migration)
DO $$
DECLARE
    channel_num TEXT := '+447701046898';
BEGIN
    -- Fix outbound messages (sender = channel number, but marked as inbound)
    UPDATE whatsapp_messages
    SET 
        direction = 'outbound',
        -- Swap sender and receiver for outbound messages
        sender_phone = channel_num,
        receiver_phone = CASE 
            WHEN sender_phone = channel_num THEN receiver_phone
            ELSE sender_phone
        END
    WHERE sender_phone = channel_num
      AND direction = 'inbound';

    RAISE NOTICE 'Fixed % outbound messages', (SELECT COUNT(*) FROM whatsapp_messages WHERE sender_phone = channel_num AND direction = 'outbound');

    -- Verify inbound messages are correct (receiver = channel number)
    UPDATE whatsapp_messages
    SET direction = 'inbound'
    WHERE receiver_phone = channel_num
      AND sender_phone != channel_num
      AND direction = 'outbound';

    RAISE NOTICE 'Fixed % inbound messages', (SELECT COUNT(*) FROM whatsapp_messages WHERE receiver_phone = channel_num AND direction = 'inbound');
END $$;
