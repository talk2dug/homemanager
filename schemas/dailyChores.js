import mongoose from "mongoose";
mongoose.connect("mongodb://127.0.0.1:27017/tism");

var schema = mongoose.Schema({
  Title: String,
  Assigned:  String,
  When: Date,
  Completed: Date,
  DOW: String,
  NotCompleted: Boolean,
  NumOfStars: Number 
})
schema.set("toJSON", {
  virtuals: true,
});
var dailychores = mongoose.model("DailyChores", schema, "dailychores");
export default dailychores
//module.exports = chores;  