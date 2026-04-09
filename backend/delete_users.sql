-- Delete from all tables that reference users in correct order
-- First delete orders (references users)
DELETE FROM "orders"
WHERE "user_id" IN (
  'mnbjzn807kz6', 'mnbk1uawawi7', 'mnbk2kzjqopv', 'mnbkfpdt4d6n',
  'mnbqkozbkhyf', 'mnfsczc0ujfz', 'mnfxwtizqsy4', 'mnfxyfjc6wr4',
  'mng5ex1zm33t', 'mnikipxp5wde', 'mnmx09tac4a7', 'mnmxadrqxul5',
  'mnmxbaz8ayfd', 'mnmy2a28n06p'
);

-- Delete cards (references users)
DELETE FROM "cards"
WHERE "user_id" IN (
  'mnbjzn807kz6', 'mnbk1uawawi7', 'mnbk2kzjqopv', 'mnbkfpdt4d6n',
  'mnbqkozbkhyf', 'mnfsczc0ujfz', 'mnfxwtizqsy4', 'mnfxyfjc6wr4',
  'mng5ex1zm33t', 'mnikipxp5wde', 'mnmx09tac4a7', 'mnmxadrqxul5',
  'mnmxbaz8ayfd', 'mnmy2a28n06p'
);

-- Delete notifications (references users)
DELETE FROM "notifications"
WHERE "user_id" IN (
  'mnbjzn807kz6', 'mnbk1uawawi7', 'mnbk2kzjqopv', 'mnbkfpdt4d6n',
  'mnbqkozbkhyf', 'mnfsczc0ujfz', 'mnfxwtizqsy4', 'mnfxyfjc6wr4',
  'mng5ex1zm33t', 'mnikipxp5wde', 'mnmx09tac4a7', 'mnmxadrqxul5',
  'mnmxbaz8ayfd', 'mnmy2a28n06p'
);

-- Delete birthdays (references users)
DELETE FROM "birthdays"
WHERE "user_id" IN (
  'mnbjzn807kz6', 'mnbk1uawawi7', 'mnbk2kzjqopv', 'mnbkfpdt4d6n',
  'mnbqkozbkhyf', 'mnfsczc0ujfz', 'mnfxwtizqsy4', 'mnfxyfjc6wr4',
  'mng5ex1zm33t', 'mnikipxp5wde', 'mnmx09tac4a7', 'mnmxadrqxul5',
  'mnmxbaz8ayfd', 'mnmy2a28n06p'
);

-- Finally delete the users
DELETE FROM "users"
WHERE "id" IN (
  'mnbjzn807kz6', 'mnbk1uawawi7', 'mnbk2kzjqopv', 'mnbkfpdt4d6n',
  'mnbqkozbkhyf', 'mnfsczc0ujfz', 'mnfxwtizqsy4', 'mnfxyfjc6wr4',
  'mng5ex1zm33t', 'mnikipxp5wde', 'mnmx09tac4a7', 'mnmxadrqxul5',
  'mnmxbaz8ayfd', 'mnmy2a28n06p'
);
