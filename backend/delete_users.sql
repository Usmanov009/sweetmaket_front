-- Delete specific users and their related data
-- First delete orders (references users)
DELETE FROM "orders"
WHERE "user_id" IN (
  'mnrajitfxzxz', 'mnrankkyjqxu'
);

-- Delete cards (references users)
DELETE FROM "cards"
WHERE "user_id" IN (
  'mnrajitfxzxz', 'mnrankkyjqxu'
);

-- Delete notifications (references users)
DELETE FROM "notifications"
WHERE "user_id" IN (
  'mnrajitfxzxz', 'mnrankkyjqxu'
);

-- Delete birthdays (references users)
DELETE FROM "birthdays"
WHERE "user_id" IN (
  'mnrajitfxzxz', 'mnrankkyjqxu'
);

-- Finally delete the users
DELETE FROM "users"
WHERE "id" IN (
  'mnrajitfxzxz', 'mnrankkyjqxu'
);
