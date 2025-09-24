import mongoose from "mongoose";
mongoose.connect("mongodb://127.0.0.1:27017/tism");

var schema = mongoose.Schema({
  WeekNumber: Number,
  PossibleStars: Number,
  Assigned: String,
  Chores:{
    Monday:[{
        Title: String,
        TimeOfDay: String,
        When: Date,
        DOW: String,
        NumOfStars: Number,
        OriginalChoreID: String,
        CompletedDate: Date,
        Completed: {type: Boolean, default: false},
        ParrentConfirmed: {type: Boolean, default: false}
        
      }],
    Tuesday:[{
        Title: String,
        When: Date,
        TimeOfDay: String,
        CompletedDate: Date,
        Completed: {type: Boolean, default: false},
        DOW: String,
        NumOfStars: Number,
        ParrentConfirmed: {type: Boolean, default: false},
        OriginalChoreID: String,

      }],
    Wednesday:[{
        Title: String,
        When: Date,
        TimeOfDay: String,
        CompletedDate: Date,
        Completed: {type: Boolean, default: false},
        DOW: String,
        NumOfStars: Number,
        ParrentConfirmed: {type: Boolean, default: false},
        OriginalChoreID: String,
    
      }],
    Thursday:[{
        Title: String,
        When: Date,
        TimeOfDay: String,
        CompletedDate: Date,
        Completed: {type: Boolean, default: false},
        DOW: String,
        NumOfStars: Number,
        ParrentConfirmed: {type: Boolean, default: false},
        OriginalChoreID: String,

      }],
    Friday:[{
        Title: String,
        When: Date,
        TimeOfDay: String,
        CompletedDate: Date,
        Completed: {type: Boolean, default: false},
        DOW: String,
        NumOfStars: Number,
        ParrentConfirmed: {type: Boolean, default: false},
        OriginalChoreID: String,

      }],
    Saturday:[{
        Title: String,
        When: Date,
        CompletedDate: Date,
        Completed: Boolean,
        DOW: String,
        NumOfStars: Number,
        ParrentConfirmed: {type: Boolean, default: false},
        OriginalChoreID: String
  }],
    Sunday:[{
        Title: String,
        When: Date,
        CompletedDate: Date,
        Completed: {type: Boolean, default: false},
        DOW: String,
        NumOfStars: Number,
        ParrentConfirmed: {type: Boolean, default: false},
        OriginalChoreID: String


      }]
},
})
schema.set("toJSON", {
  virtuals: true,
});
var weeklychores = mongoose.model("WeeklyChores", schema, "weeklychores");
export default weeklychores
//module.exports = chores;  