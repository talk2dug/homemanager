import mongoose from "mongoose";
mongoose.connect("mongodb://127.0.0.1:27017/tism");

var schema = mongoose.Schema({
  Person: String,
  CurrentMoney:  Number,
  weekOf: Number,
  numOfStars: Number,
  PercentCompleted: Number,
  ChoresNotDOne:[{
      Title: String,
      DateOfCHore: Date,
      CompletedDate: Date,
      Completed: Boolean,
      DOW: String,
      NotCompleted: Boolean,
      NumOfStars: Number,
      ParrentConfirmed: Boolean,
      OriginalChoreID: String,
  }],

}) 
schema.set("toJSON", {
  virtuals: true,
});
var payout = mongoose.model("PayOut", schema, "payout");
export default payout
//module.exports = chores;