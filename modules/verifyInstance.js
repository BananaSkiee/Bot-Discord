const VerifySystem = require('./verify');

// ✅ BUAT SINGLE INSTANCE DI SINI SAJA
const verifySystem = new VerifySystem();

console.log('✅ VerifySystem single instance created');

module.exports = verifySystem;
