const path = require("path");
const { LowSync } = require("lowdb");
const { JSONFileSync } = require("lowdb/node");

const file = path.join(__dirname, "../data/taggedUsers.json");
const adapter = new JSONFileSync(file);
const db = new LowSync(adapter);

db.read();
db.data ||= {}; // kalau kosong, buat objek kosong
db.write();

module.exports = db;
