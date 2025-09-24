const mongoose = require('../mongoose.cjs');

const { Schema } = mongoose;

const cagesSchema = new Schema(
  [
    {
      CageNumber: { type: Number },
      Type: { type: String, default: '' },
    },
  ],
  { strict: false }
);

cagesSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Cages', cagesSchema, 'cages');