require('dotenv').config({ path: require('path').join(__dirname, '.env') });
module.exports = process.env.JWT_SECRET || 'sweetmarket_secret_2024';
