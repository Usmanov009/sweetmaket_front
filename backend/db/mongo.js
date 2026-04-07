const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
const client = new MongoClient(uri);

let db;

async function connectDB() {
  try {
    await client.connect();
    console.log('✅ MongoDB ga ulanish muvaffaqiyatli');
    db = client.db('sweetmarket');
    return db;
  } catch (error) {
    console.error('❌ MongoDB ulanish xatoligi:', error);
    throw error;
  }
}

function getDB() {
  if (!db) {
    throw new Error('MongoDB ulanmagan. Avval connectDB() ni chaqiring.');
  }
  return db;
}

module.exports = { connectDB, getDB };
