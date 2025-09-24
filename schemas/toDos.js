import mongoose from "mongoose";
mongoose.connect("mongodb://127.0.0.1:27017/tism");

var schema = mongoose.Schema({
  Title: String,
  Assigned:  String,
  Priority: String,
  Description: String,
  Completed: Date,
  Notes:[{
    Note: String,
    Date: Date,


  }]
  });
schema.set("toJSON", {
  virtuals: true,
});
var todos = mongoose.model("ToDos", schema, "todos");
export default todos
//module.exports = chores;