const mongoose = require('../mongoose.cjs');

const { Schema } = mongoose;

const rabbitsSchema = new Schema({
  Name: { type: String, default: '-' },
  Pic: { type: String, default: '' },
  Breed: { type: String, default: '' },
  Father: { type: String, default: '' },
  Mother: { type: String, default: '' },
  Date_Born: { type: Date, default: '01/03/1975' },
  Sex: { type: String, default: 'Not Sexed' },
  Bought: { type: Boolean, default: false },
  Breeder: { type: String, default: '' },
  DateReadyToBreed: { type: Date },
  ReadyToBreed: { type: Boolean, default: false },
  Cage: { type: String, default: 'UnAssigned' },
  Files: { type: [Schema.Types.Mixed] },
  Mated: { type: [Schema.Types.Mixed] },
  CurrentWeight: { type: [Schema.Types.Mixed] },
  Notes: { type: [Schema.Types.Mixed] },
});

rabbitsSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Rabbits', rabbitsSchema, 'rabbits');
