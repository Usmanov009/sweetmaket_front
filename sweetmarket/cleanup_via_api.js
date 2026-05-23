import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

const userIds = [
  'mnyadp5413j2', 'mnydgdtr95sy', 'mnyf1f52cxb8', 'mnyfhybwk2b0', 'mnyg9asi6dpy',
  'mnygh7gtqsrq', 'mnzvwyr4z4ba', 'mnzvyx0nci7v', 'mnzzle3gmiin', 'mnzzlq38r0j5',
  'mo01hyiby6tk', 'mo07fgyjbeoo', 'mo09dbcdxdf6', 'mo09dupv9768', 'mo0w4hcs4wu0',
  'mo0w4w8260vj', 'mo0w5l1yj7h7', 'mo0w68p0af1z', 'mo2jknuk48i8', 'mo34a0odysn8',
  'mo35sjwfxjlb'
];

async function cleanupUsers() {
  try {
    console.log('Attempting cleanup via admin API...');
    
    const response = await fetch(`${API_BASE}/admin/cleanup-users`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Cleanup successful:', result);
    } else {
      console.error('❌ Cleanup failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanupUsers();
