import mongoose from "mongoose";
mongoose.connect("mongodb://127.0.0.1:27017/tism");

var schema = mongoose.Schema({
  Title: String,
  Assigned:  String,
  Frequency: String,
  When: String,
  NumOfStars: String,
  Active: {
    type:Boolean,
    default: false}
  });
schema.set("toJSON", {
  virtuals: true,
});
var chores = mongoose.model("Chores", schema, "chores");
export default chores
//module.exports = chores;