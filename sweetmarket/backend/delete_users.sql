-- Delete specific users and their related data
-- Run these in order (foreign key constraints require deleting child rows first)

DELETE FROM "birthdays" WHERE "user_id" IN (
  'mnyadp5413j2','mnydgdtr95sy','mnyf1f52cxb8','mnyfhybwk2b0','mnyg9asi6dpy',
  'mnygh7gtqsrq','mnzvwyr4z4ba','mnzvyx0nci7v','mnzzle3gmiin','mnzzlq38r0j5',
  'mo01hyiby6tk','mo07fgyjbeoo','mo09dbcdxdf6','mo09dupv9768','mo0w4hcs4wu0',
  'mo0w4w8260vj','mo0w5l1yj7h7','mo0w68p0af1z','mo2jknuk48i8'
);

DELETE FROM "notifications" WHERE "user_id" IN (
  'mnyadp5413j2','mnydgdtr95sy','mnyf1f52cxb8','mnyfhybwk2b0','mnyg9asi6dpy',
  'mnygh7gtqsrq','mnzvwyr4z4ba','mnzvyx0nci7v','mnzzle3gmiin','mnzzlq38r0j5',
  'mo01hyiby6tk','mo07fgyjbeoo','mo09dbcdxdf6','mo09dupv9768','mo0w4hcs4wu0',
  'mo0w4w8260vj','mo0w5l1yj7h7','mo0w68p0af1z','mo2jknuk48i8'
);

DELETE FROM "cards" WHERE "user_id" IN (
  'mnyadp5413j2','mnydgdtr95sy','mnyf1f52cxb8','mnyfhybwk2b0','mnyg9asi6dpy',
  'mnygh7gtqsrq','mnzvwyr4z4ba','mnzvyx0nci7v','mnzzle3gmiin','mnzzlq38r0j5',
  'mo01hyiby6tk','mo07fgyjbeoo','mo09dbcdxdf6','mo09dupv9768','mo0w4hcs4wu0',
  'mo0w4w8260vj','mo0w5l1yj7h7','mo0w68p0af1z','mo2jknuk48i8'
);

DELETE FROM "orders" WHERE "user_id" IN (
  'mnyadp5413j2','mnydgdtr95sy','mnyf1f52cxb8','mnyfhybwk2b0','mnyg9asi6dpy',
  'mnygh7gtqsrq','mnzvwyr4z4ba','mnzvyx0nci7v','mnzzle3gmiin','mnzzlq38r0j5',
  'mo01hyiby6tk','mo07fgyjbeoo','mo09dbcdxdf6','mo09dupv9768','mo0w4hcs4wu0',
  'mo0w4w8260vj','mo0w5l1yj7h7','mo0w68p0af1z','mo2jknuk48i8'
);

DELETE FROM "users" WHERE "id" IN (
  'mnyadp5413j2','mnydgdtr95sy','mnyf1f52cxb8','mnyfhybwk2b0','mnyg9asi6dpy',
  'mnygh7gtqsrq','mnzvwyr4z4ba','mnzvyx0nci7v','mnzzle3gmiin','mnzzlq38r0j5',
  'mo01hyiby6tk','mo07fgyjbeoo','mo09dbcdxdf6','mo09dupv9768','mo0w4hcs4wu0',
  'mo0w4w8260vj','mo0w5l1yj7h7','mo0w68p0af1z','mo2jknuk48i8'
);
