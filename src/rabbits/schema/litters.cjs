const mongoose = require('../mongoose.cjs');

const { Schema } = mongoose;

const littersSchema = new Schema({
  LitterID: { type: String, default: '' },
  Father: { type: String, default: '' },
  Mother: { type: String, default: '' },
  Bred: { type: Date },
  Born: { type: Date },
  Kids: [
    {
      Pic: { type: String, default: '' },
      Status: { type: String, default: 'Nesting' },
      Growing: { type: Boolean, default: false },
      Processed: { type: Boolean, default: false },
      KidID: { type: String, default: '' },
      Sex: { type: String, default: 'Not Sexed' },
      BirthWeight: { type: Number, default: 0 },
      FinalWeight: { type: Number, default: 0 },
      DressedWeight: { type: Number, default: 0 },
      DateProcessed: { type: Date },
      CurrentWeight: [
        {
          Weight: { type: String, default: '0' },
          Date: { type: Date },
        },
      ],
      Notes: [
        {
          Date: { type: Date },
          Title: { type: String, default: '' },
          Note: { type: String, default: '' },
        },
      ],
      Tasks: [
        {
          Title: { type: String, default: '' },
          Due: { type: Date },
          Date_Completed: { type: Date },
          Completed: { type: Boolean, default: false },
          Note: { type: String, default: '' },
        },
      ],
    },
  ],
});

littersSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Litters', littersSchema, 'litters');