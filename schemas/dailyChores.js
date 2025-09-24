import mongoose from "mongoose";
mongoose.connect("mongodb://127.0.0.1:27017/tism");

var schema = mongoose.Schema({
  Title: String,
  Assigned: String,
  When: Date,
  DateOfCHore: Date,
  CompletedDate: Date,
  Completed: Boolean,
  DOW: String,
  NotCompleted: Boolean,
  NumOfStars: Number,
  ParrentConfirmed: Boolean,
  OriginalChoreID: String,
  HasBeenCalculated: {type:Boolean,default:false}
})
schema.set("toJSON", {
  virtuals: true,
});
var dailychores = mongoose.model("DailyChores", schema, "dailychores");
export default dailychores
//module.exports = chores;  