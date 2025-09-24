const mongoose = require('../mongoose.cjs');

const { Schema } = mongoose;

const breedersSchema = new Schema({
  Name: { type: String, default: '' },
  Farm: { type: String, default: '' },
  Address: { type: String, default: '' },
  City: { type: String, default: '' },
  State: { type: String, default: '' },
  Zip: { type: Number, default: 0 },
  Email: { type: String, default: '' },
  Phone: { type: String, default: '' },
  Note: { type: String, default: '' },
  Purchases: [
    {
      Rabbit: { type: String, default: '' },
      Purchased: { type: Date },
      Cost: { type: Number, default: 0 },
    },
  ],
});

breedersSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Breeders', breedersSchema, 'breeders');