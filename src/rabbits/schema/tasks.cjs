const mongoose = require('../mongoose.cjs');

const { Schema } = mongoose;

const tasksSchema = new Schema({
  Title: { type: String, default: '' },
  Due: { type: Date },
  Date_Completed: { type: Date },
  Completed: { type: Boolean, default: false },
  Note: { type: String, default: '' },
  Rabbit: { type: String, default: '' },
  History: [
    {
      Note: { type: String, default: '' },
      Date: { type: Date, default: () => new Date() },
    },
  ],
});

tasksSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Tasks', tasksSchema, 'tasks');