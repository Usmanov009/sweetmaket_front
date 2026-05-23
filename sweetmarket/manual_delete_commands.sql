-- Manual SQL commands to delete specific users
-- Run these commands in your Neon database dashboard with admin privileges

-- First delete related data (to avoid foreign key constraints)
DELETE FROM birthdays WHERE user_id IN (
  'mnyadp5413j2', 'mnydgdtr95sy', 'mnyf1f52cxb8', 'mnyfhybwk2b0', 'mnyg9asi6dpy',
  'mnygh7gtqsrq', 'mnzvwyr4z4ba', 'mnzvyx0nci7v', 'mnzzle3gmiin', 'mnzzlq38r0j5',
  'mo01hyiby6tk', 'mo07fgyjbeoo', 'mo09dbcdxdf6', 'mo09dupv9768', 'mo0w4hcs4wu0',
  'mo0w4w8260vj', 'mo0w5l1yj7h7', 'mo0w68p0af1z', 'mo2jknuk48i8', 'mo34a0odysn8',
  'mo35sjwfxjlb'
);

DELETE FROM orders WHERE user_id IN (
  'mnyadp5413j2', 'mnydgdtr95sy', 'mnyf1f52cxb8', 'mnyfhybwk2b0', 'mnyg9asi6dpy',
  'mnygh7gtqsrq', 'mnzvwyr4z4ba', 'mnzvyx0nci7v', 'mnzzle3gmiin', 'mnzzlq38r0j5',
  'mo01hyiby6tk', 'mo07fgyjbeoo', 'mo09dbcdxdf6', 'mo09dupv9768', 'mo0w4hcs4wu0',
  'mo0w4w8260vj', 'mo0w5l1yj7h7', 'mo0w68p0af1z', 'mo2jknuk48i8', 'mo34a0odysn8',
  'mo35sjwfxjlb'
);

DELETE FROM cards WHERE user_id IN (
  'mnyadp5413j2', 'mnydgdtr95sy', 'mnyf1f52cxb8', 'mnyfhybwk2b0', 'mnyg9asi6dpy',
  'mnygh7gtqsrq', 'mnzvwyr4z4ba', 'mnzvyx0nci7v', 'mnzzle3gmiin', 'mnzzlq38r0j5',
  'mo01hyiby6tk', 'mo07fgyjbeoo', 'mo09dbcdxdf6', 'mo09dupv9768', 'mo0w4hcs4wu0',
  'mo0w4w8260vj', 'mo0w5l1yj7h7', 'mo0w68p0af1z', 'mo2jknuk48i8', 'mo34a0odysn8',
  'mo35sjwfxjlb'
);

DELETE FROM notifications WHERE user_id IN (
  'mnyadp5413j2', 'mnydgdtr95sy', 'mnyf1f52cxb8', 'mnyfhybwk2b0', 'mnyg9asi6dpy',
  'mnygh7gtqsrq', 'mnzvwyr4z4ba', 'mnzvyx0nci7v', 'mnzzle3gmiin', 'mnzzlq38r0j5',
  'mo01hyiby6tk', 'mo07fgyjbeoo', 'mo09dbcdxdf6', 'mo09dupv9768', 'mo0w4hcs4wu0',
  'mo0w4w8260vj', 'mo0w5l1yj7h7', 'mo0w68p0af1z', 'mo2jknuk48i8', 'mo34a0odysn8',
  'mo35sjwfxjlb'
);

-- Finally delete the users
DELETE FROM users WHERE id IN (
  'mnyadp5413j2', 'mnydgdtr95sy', 'mnyf1f52cxb8', 'mnyfhybwk2b0', 'mnyg9asi6dpy',
  'mnygh7gtqsrq', 'mnzvwyr4z4ba', 'mnzvyx0nci7v', 'mnzzle3gmiin', 'mnzzlq38r0j5',
  'mo01hyiby6tk', 'mo07fgyjbeoo', 'mo09dbcdxdf6', 'mo09dupv9768', 'mo0w4hcs4wu0',
  'mo0w4w8260vj', 'mo0w5l1yj7h7', 'mo0w68p0af1z', 'mo2jknuk48i8', 'mo34a0odysn8',
  'mo35sjwfxjlb'
);

-- Check if users were deleted
SELECT COUNT(*) as remaining_users FROM users WHERE id IN (
  'mnyadp5413j2', 'mnydgdtr95sy', 'mnyf1f52cxb8', 'mnyfhybwk2b0', 'mnyg9asi6dpy',
  'mnygh7gtqsrq', 'mnzvwyr4z4ba', 'mnzvyx0nci7v', 'mnzzle3gmiin', 'mnzzlq38r0j5',
  'mo01hyiby6tk', 'mo07fgyjbeoo', 'mo09dbcdxdf6', 'mo09dupv9768', 'mo0w4hcs4wu0',
  'mo0w4w8260vj', 'mo0w5l1yj7h7', 'mo0w68p0af1z', 'mo2jknuk48i8', 'mo34a0odysn8',
  'mo35sjwfxjlb'
);
