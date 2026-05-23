-- Fix foreign key constraints to use CASCADE delete
ALTER TABLE birthdays DROP CONSTRAINT IF EXISTS birthdays_user_id_fkey;
ALTER TABLE birthdays ADD CONSTRAINT birthdays_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_user_id_fkey;
ALTER TABLE cards ADD CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
