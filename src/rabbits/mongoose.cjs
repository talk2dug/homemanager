const mongoose = require('mongoose');

const defaultUri = 'mongodb://127.0.0.1:27017/Rabbits';
const uri = process.env.RABBITS_DB_URI || defaultUri;

if (mongoose.connection.readyState === 0) {
  mongoose.connect(uri).catch((err) => {
    console.error('Failed to connect to MongoDB for rabbits module', err);
  });
}

module.exports = mongoose;