import mongoose from "mongoose";
mongoose.connect("mongodb://127.0.0.1:27017/tism");

var schema = mongoose.Schema({
  userName: String,
  password: String,

  });
schema.set("toJSON", {
  virtuals: true,
});
var users = mongoose.model("Users", schema, "users");
export default users
//module.exports = chores;