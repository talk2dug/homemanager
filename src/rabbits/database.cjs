var express = require("express");
var router = express.Router();
const Rabbits = require('./schema/rabbits.cjs');
const Breeders = require('./schema/breeders.cjs');
const Litters = require('./schema/litters.cjs');
const Tasks = require('./schema/tasks.cjs');
const Cages = require('./schema/cages.cjs');
var moment = require("moment");

const fs = require("fs");
const path = require("path");
const STORAGE_ROOT = process.env.RABBITS_STORAGE_ROOT || path.join(process.cwd(), 'storage', 'rabbits');
const FILES_DIR = path.join(STORAGE_ROOT, 'Files');
const PICS_DIR = path.join(STORAGE_ROOT, 'pics');
const PUBLIC_BASE_URL = (process.env.RABBITS_PUBLIC_BASE_URL || 'rabbits/uploads').replace(/\/$/u, '');
const buildPublicPath = (folder, filename) => {
  const relative = path.posix.join(folder, filename);
  return PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL}/${relative}` : relative;
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDir(FILES_DIR);
ensureDir(PICS_DIR);
const breeders = require('./schema/breeders.cjs');
/* GET users listing. */

async function main() {
  const doc = new Rabbits();

  doc.Name = "Dip Shit";
  doc.Breed = "Mixed Cat";
  doc.Father = "Frerd";
  doc.Mother = "Willma";
  doc.Date_Born = "10/10/25";
  doc.Sex = "Male";
  // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
  // to MongoDB.
  await doc.save();

  const rabbit = await Rabbits.find();
  //// console.log(rabbit);
}
router.get("/", async function (req, res, next) {
  res.send();
});
router.get("/getRabbits/", async function (req, res, next) {
  // main();

  const rabbit = await Rabbits.find({
    Name: {
      $ne: null,
    },
  });
  console.log(rabbit)
  //// console.log(rabbit);

  res.send(rabbit);
});
router.get("/getBreeders/", async function (req, res, next) {
  // main();

  const breeders = await Breeders.find({});

  breeders.map((breeder) => {
    Rabbits.find({
      Breeder: breeder.Name,
    }).then((items) => {
      breeders.Purchases = items;
    });
  });

  res.send(breeders);
});
router.get("/getBunnies/", async function (req, res, next) {
  // main();
  Rabbits.find({
    Name: {
      $ne: null,
    },
  }).then((items) => {
    //console.log(items)
    res.send(items);
  });
});
router.get("/getGrowing", async function (req, res, next) {
  // main();
  let sendKids = [];
  let bornDate;
  const Litter = await Litters.find({
    "Kids.Growing": "true",
  });
  Litter.map((litter) => {
    bornDate = litter.Born;
    // console.log(litter)
    litter.Kids.map((kidsItem) => {
      if (kidsItem.Status === "Growing") {
        let sendItems = {
          Born: bornDate,
        };

        sendItems.CurrentWeight = kidsItem.CurrentWeight;
        sendItems.KidItemID = kidsItem.id;
        sendItems.LitterIDDB = litter.id;
        sendItems.LitterID = litter.LitterID;
        sendItems.FinalDate = kidsItem.FinalDate;
        sendItems.FinalWeight = kidsItem.FinalWeight;
        sendItems.Growing = kidsItem.Growing;
        sendItems.KidID = kidsItem.KidID;
        sendItems.Notes = kidsItem.Notes;
        sendItems.SecondDate = kidsItem.SecondDate;
        sendItems.SecondWeight = kidsItem.SecondWeight;
        sendItems.Sex = kidsItem.Sex;
        sendItems.Status = kidsItem.Status;
        sendItems.Tasks = kidsItem.Tasks;
        sendKids.push(sendItems);
      }
    });
  });
  res.send(sendKids);
});
router.get("/getRabbitbtid/:rabbitid", async function (req, res, next) {
  // main();
  var rabbitID = req.params.rabbitid;
  const rabbitInfo = await Rabbits.find({
    _id: rabbitID,
  });
  console.log(rabbitInfo);
  res.send(rabbitInfo);
});
router.get("/getRabbit/:rabbit", async function (req, res, next) {
  // main();
  var rabbit = req.params.rabbit;
  const rabbitInfo = await Rabbits.find({
    Name: rabbit,
  });
  res.send(rabbitInfo);
  //// console.log(rabbitInfo);
  // try {

  //  // console.log(rabbitInfo[0].Files[0])
  //   fs.stat('/home/jack/rabbits/' + rabbitInfo[0].Files[0], (err, stats) => {
  //     if (err) {
  //       console.error('Error getting file stats:', err);
  //       return;
  //     }
  //     const fileNameWithExtension = path.basename(rabbitInfo[0].Files[0]);
  //    // console.log(fileNameWithExtension);
  //    // console.log('File Name:', stats)
  //     stats.FileName = fileNameWithExtension
  //    // console.log('File Size (bytes):', stats.size);
  //    // console.log('Is Directory:', stats.isDirectory());
  //    // console.log('Is File:', stats.isFile());
  //    // console.log('Last Modified Date:', stats.mtime);
  //
  //     // Many other properties are available in the 'stats' object
  //   });
  // } catch (error) {

  // }
});
router.get("/getMotherLitter/:rabbit", function (req, res) {
  var rabbit = req.params.rabbit;
  let litters = Litters.find({
    Mother: rabbit,
  });
  Litters.find({}).then((items) => {
    //// console.log(items)
    res.send(items);
  });
});
router.get("/getRabbitLitters", function (req, res) {
  Litters.find().then((items) => {
    res.send(items);
  });
});
router.get("/getRabbitLitters/:rabbit", function (req, res) {
  var rabbit = req.params.rabbit;
  let litters = Litters.find({
    Mother: rabbit,
  });
  Litters.find({
    $or: [
      {
        Mother: rabbit,
      }, // Condition 1
      {
        Father: rabbit,
      }, // Condition 2
    ],
  }).then((items) => {
    res.send(items);
  });
});
router.get("/getRabbitLitter/:id", function (req, res) {
  var id = req.params.id;
  Litters.findById(id).then((item) => {
    res.send(item);
  });
});
router.get("/delALL", async function (req, res, next) {
  // main();
  const query = {};
  const result = await Rabbits.deleteMany(query);
  const result2 = await Litters.deleteMany(query);
  const result3 = await Tasks.deleteMany(query);
  const result4 = await Breeders.deleteMany(query);

  let sendData = {
    Rabbits: result,
    Litters: result2,
    Tasks: result3,
    breeders: result4,
  };
  //// console.log(rabbit);

  res.send(sendData);
});
router.get("/getLitterKidNotes/:LitterID/:KidID", function (req, res) {
  let litterID = req.params.LitterID;
  let rabbitID = req.params.KidID;
  async function findKidById(litterID, rabbitID) {
    try {
      const litter = await Litters.findById(litterID);
      if (!litter) {
        // console.log('User not found.');
        return null;
      }

      const kid = litter.Kids.id(rabbitID);
      if (kid) {
        // console.log('Found Litter:', litter);

        // console.log('Found Kid:', kid);
        res.send(kid);
        return kid;
      } else {
        // console.log('Address not found within user.');
        return null;
      }
    } catch (error) {
      console.error("Error finding address:", error);
      return null;
    }
  }
  findKidById(litterID, rabbitID);
});
router.post("/addPurchase/:breederID", function (req, res) {
  var requested = req.body;
  var breederID = req.params.breederID;

  let Purchased = moment(requested.PurchaseInputs["RaPurchasedbbit"]).local();
  let Rabbit = requested.PurchaseInputs["Rabbit"];
  let Cost = requested.PurchaseInputs["Cost"];

  Breeders.findById(breederID).then((item) => {
    // console.log(item)
    item.Purchases.push({
      Rabbit: Rabbit,
      Purchased: Purchased,
      Cost: Cost,
    });
    item.save();

    res.status(200).end();
  });
});
router.post("/newnote/:itemType", function (req, res) {
  var requested = req.body;
  var itemType = req.params.itemType;
  console.log(requested)
  // console.log("requested")
  // console.log(requested)
  if (itemType == "rabbit") {
    let rabbitID = requested["id"];
    let rabbit = requested["Rabbit"];
    let date = new Date();
    let title = requested["Title"];
    let note = requested["Note"];
    // console.log(requested)

    Rabbits.findById(rabbitID).then((item) => {
      // console.log(item)
      item.Notes.push({
        Note: note,
        Title: title,
        Date: date,
      });
      item.save();

      res.status(200).end();
    });
  }
  if (itemType == "Kid") {
    let litterID = requested["LitterID"];
    let rabbitID = requested["KidID"];
    //// console.log(litterID)
    //// console.log(rabbitID)
    let date = requested["Date"];
    let title = requested["Title"];
    let note = requested["Note"];
    //// console.log(requested)
    async function findKidById(litterID, rabbitID) {
      try {
        const litter = await Litters.findById(litterID);
        if (!litter) {
          // console.log('User not found.');
          return null;
        }

        const kid = litter.Kids.id(rabbitID);
        if (kid) {
          // console.log('Found Litter:', litter);

          kid.Notes.push({
            Note: note,
            Title: title,
            Date: date,
          });
          litter.save();

          res.status(200).end();
          // console.log('Found Kid:', kid);
          return kid;
        } else {
          // console.log('Address not found within user.');
          return null;
        }
      } catch (error) {
        console.error("Error finding address:", error);
        return null;
      }
    }
    findKidById(litterID, rabbitID);
  }
});
router.post("/addRabbitWeight", async function (req, res) {
  let data = req.body;
  console.log(data);
  let id = data.id;
  Rabbits.findById(id).then((item) => {
    console.log(item);
    item.CurrentWeight.push({
      Weight: data.Weight,
      Date: moment().format("MM/DD/YY"),
    });
    item.save();

    res.status(200).end();
  });
});
router.post("/uploadFile", async function (req, res) {
  // console.log(req.files);
  var requested = req.body;
  // console.log(requested)
  let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  sampleFile = req.files.file;
  uploadPath = path.join(FILES_DIR, sampleFile.name);
  // console.log(uploadPath)
  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(uploadPath, function (err) {
    if (err)
      // console.log(err)
      return res.status(500).send(err);
  });
  const rabbit = await Rabbits.findById(requested.rabbit);
  rabbit.Files.push(buildPublicPath('Files', sampleFile.name));
  rabbit.save();
  res.send("File uploaded!");
});
router.post("/updateRabbit", function (req, res) {
  let sampleFile;
  let uploadPath;
  var requested = req.body;
  let id = requested["id"];
  // console.log(requested)
  if (req.files) {
    sampleFile = req.files.file;
    uploadPath = path.join(PICS_DIR, sampleFile.name);
    requested.Pic = buildPublicPath('pics', sampleFile.name);

    // console.log(requested)
    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function (err) {
      if (err) console.log(err);
      return res.status(500).send(err);
    });
  }
  let set = requested;
  Rabbits.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: set,
    },
    {
      upsert: true,
    },
    {
      new: true,
    } // Return the updated document
  )
    .then((rabbit) => {
      // console.log("UPDATED")
      // console.log(rabbit)
      res.status(200).end();
    })
    .catch((e) => {
      // console.log(e)
    });
});
router.post("/updateRabbitKids/:litterID/:rabbitID", function (req, res) {
  var requested = req.body;
  var litterID = req.params.litterID;
  let rabbitID = req.params.rabbitID;
  console.log(requested);
  // console.log(rabbitID)
  let set = {};

  let updateItems = "";

  console.log(updateItems);
  async function findKidById(litterID, rabbitID) {
    try {
      const litter = await Litters.findById(litterID);
      if (!litter) {
        console.log("User not found.");
        return null;
      }

      const kid = litter.Kids.id(rabbitID);
      if (kid) {
        console.log("Found Litter:");
        console.log("Found KID:");
        for (var field in requested) {
          kid[field] = requested[field];
          if (field == "DateProcessed") {
            kid["Status"] = "Processed";
            kid["Processed"] = true;
            kid["Growing"] = false;
          }
          console.log(kid.Status);
          if (kid.Status == "Growing") {
            kid["Processed"] = false;
            kid["Growing"] = true;
          }
        }

        litter.save();
        // console.log('Found Kid:', kid);
        res.status(200).end();
        return kid;
      } else {
        console.log("Address not found within user.");
        res.status(500).end();
        return null;
      }
    } catch (error) {
      console.error("Error finding address:", error);
      return null;
    }
  }
  findKidById(litterID, rabbitID);
});
router.post("/updateRabbitMate", function (req, res) {
  var requested = req.body;
  let doe = requested["Doe"];
  let Buck = requested["Buck"];
  let date = requested["Date"];
  let note = requested["Note"];

  let set = {
    Buck: Buck,
    Date: date,
    Note: note,
  };
  console.log(set);
  Rabbits.findOne({ Name: doe }).then((item) => {
    // console.log(item)
    item.Mated.push(set);
    item.ReadyToBreed = false;

    item.DateReadyToBreed = moment(date).add(83, "days");
    item.save();
    const doc = new Tasks();

    doc.Title = "Add Nesting Box";
    doc.Note = "Need to add a nesting box to " + doe + " cage";
    doc.Due = moment(date).add(27, "days");
    doc.Rabbit = doe;
    //// console.log(doc)
    // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
    // to MongoDB.
    doc.save();

    const doc2 = new Tasks();

    doc2.Title = "Palpate Doe";
    doc2.Note = "Palpate " + doe;
    doc2.Due = moment(date).add(14, "days");
    doc2.Rabbit = doe;
    //// console.log(doc)
    // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
    // to MongoDB.
    doc2.save();

    res.status(200).end();
  });
});
router.post("/updateTask", function (req, res) {
  var requested = req.body;
  let id = requested["id"];
  let completed = requested["Completed"];

  Tasks.findOne({ _id: id }).then((item) => {
    console.log(item);
    item.History.push({
      Note: requested["History"],
      Date: new Date(),
    });
    (item.Completed = completed), (item.Date_Completed = moment().local());
    item.save();
  });
});
router.get("/getTasks/", function (req, res) {
  var rabbit = req.params.rabbit;
  Tasks.find().then((items) => {
    items.forEach((obj) => {
      if (obj.Due) {
        if (!moment(obj.Due).isBefore(moment(), "day")) {
        }
        if (moment(obj.Due).isBefore(moment(), "day")) {
        }
      }
    });

    //console.log(items)
    res.send(items);
  });
});
router.get("/getTasks/:rabbit", function (req, res) {
  var rabbit = req.params.rabbit;
  Tasks.find({
    Rabbit: rabbit,
  }).then((items) => {
    //// console.log(items)
    res.send(items);
  });
});
router.get("/getTasksDue/", function (req, res) {
  async function findUnavailableProducts() {
    try {
      const notDoneTasks = await Tasks.find({
        Completed: false,
      });
      // console.log(' not done :', notDoneTasks);
      res.send(notDoneTasks);
    } catch (error) {
      console.error("Error finding products:", error);
    }
  }

  findUnavailableProducts();
});
router.get("/getLitter/:litter", function (req, res) {
  var litter = req.params.litter;
  Litters.find({ LitterID: litter }).then((items) => {
    //console.log(items)
    res.send(items);
  });
});
router.post("/newweight", function (req, res) {
  // console.log(req.body)
  let requested = req.body;
  console.log("requestdData");

  console.log(requested);

  async function findKidById(litterID, rabbitID, date, weight) {
    try {
      const litter = await Litters.findById(litterID);
      if (!litter) {
        console.log("User not found.");
        return null;
      }

      const kid = litter.Kids.id(rabbitID);
      if (kid) {
        console.log("Found Litter:");
        console.log("Found KID");
        kid.CurrentWeight.push({
          Weight: parseFloat(weight),
          Date: date,
        });
        try {
          litter.save();
        } catch (error) {
          console.log(error);
        }

        console.log("Found Kid:");
        return kid;
      } else {
        console.log("Address not found within user.");
        return null;
      }
    } catch (error) {
      console.error("Error finding address:", error);
      return null;
    }
  }

  let litterID = requested["Litter"];
  let rabbitID = requested["Rabbit"];
  console.log(litterID);
  console.log(rabbitID);
  let date = requested["Date"];
  let weight = requested["Weight"];
  findKidById(litterID, rabbitID, date, weight);

  res.status(200).end();
});
router.post("/newbirthweight", function (req, res) {
  // console.log(req.body)
  let requested = req.body;

  let litterID = requested["Litter"];
  let rabbitID = requested["Rabbit"];
  let weight = requested["BirthWeight"].toString();
  async function findKidById(litterID, rabbitID) {
    try {
      const litter = await Litters.findById(litterID);
      if (!litter) {
        // console.log('User not found.');
        return null;
      }

      const kid = litter.Kids.id(rabbitID);
      if (kid) {
        //console.log('Found Litter:',litter);
        //// console.log('Found KID:',kid);
        kid.BirthWeight = parseFloat(weight);

        litter.save();
        // console.log('Found Kid:', kid);
        return kid;
      } else {
        // console.log('Address not found within user.');
        return null;
      }
    } catch (error) {
      console.error("Error finding address:", error);
      return null;
    }
  }
  findKidById(litterID, rabbitID);

  res.status(200).end();
});
router.post("/newtask", function (req, res) {
  //// console.log(req.body)
  const doc = new Tasks();

  doc.Title = req.body.Title;
  doc.Date_Completed = req.body.Date_Completed;
  doc.Note = req.body.Note;
  doc.Completed = req.body.Completed;
  doc.Due = moment(req.body.Due).set({ hour: 18, minute: 59 });
  doc.Rabbit = req.body.Rabbit;
  //// console.log(doc)
  // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
  // to MongoDB.
  doc.save();
  res.status(200).end();
});
router.post("/newRabbit", function (req, res) {
  // console.log(req.body)
  const doc = new Rabbits();

  doc.Name = req.body.Name;
  doc.Breed = req.body.Breed;
  doc.Father = req.body.Father;
  doc.Mother = req.body.Mother;
  doc.Date_Born = req.body.Date_Born;
  doc.Sex = req.body.Sex;
  //// console.log(doc)
  // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
  // to MongoDB.
  doc.save();

  res.status(200).end();
});
router.post("/editLitter", function (req, res) {
  var requested = req.body;
  let id = requested["id"];

  let set = {
    LitterID: requested.litterinputs["LitterID"],
    Father: requested.litterinputs["Father"],
    Mother: requested.litterinputs["Mother"],
    Bred: requested.litterinputs["Bred"],
    Born: requested.litterinputs["Born"],
    Cage: requested.litterinputs["Cage"],
  };
  Litters.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: set,
    },
    {
      upsert: true,
    },
    {
      new: true,
    } // Return the updated document
  )
    .then((user) => {
      // console.log("UPDATED")
      // console.log(user)
      res.status(200).end();
    })
    .catch((e) => {
      // console.log(e)
    });
});
router.post("/editbreeder", function (req, res) {
  var requested = req.body;
  let breeder = requested.breederinputs["Breeder"];

  let set = {
    Address: requested.breederinputs["Address"],
    Name: requested.breederinputs["Name"],
    Farm: requested.breederinputs["Farm"],
    City: requested.breederinputs["City"],
    State: requested.breederinputs["State"],
    Zip: requested.breederinputs["Zip"],
    Phone: requested.breederinputs["Phone"],
    Note: requested.breederinputs["Note"],
    Email: requested.breederinputs["Email"],
  };
  Breeders.findOneAndUpdate(
    {
      Name: breeder,
    },
    {
      $set: set,
    },
    {
      upsert: true,
    },
    {
      new: true,
    } // Return the updated document
  )
    .then((user) => {
      // console.log("UPDATED")
      // console.log(user)
      res.status(200).end();
    })
    .catch((e) => {
      console.log(e);
    });
});
router.post("/newLitter", function (req, res) {
  let literData = req.body;
  //console.log(typeof(literData))
  // console.log(literData)
  //// console.log(literData.Father)
  const doc = new Litters();

  doc.LitterID = literData.litterinputs.LitterID;
  doc.Father = literData.litterinputs.Father;
  doc.Mother = literData.litterinputs.Mother;
  doc.Born = literData.litterinputs.Born;
  doc.Bred = literData.litterinputs.Bred;
  doc.Kids = literData.Kids;

  // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
  // to MongoDB.
  doc.save();
  const doc2 = new Tasks();

  doc2.Title = "Wean Babbies";
  doc2.Note = "Wean babbies for litter " + literData.litterinputs.LitterID;
  doc2.Due = moment(literData.litterinputs.Born).add(42, "days");
  doc2.Rabbit = literData.litterinputs.Mother;
  //// console.log(doc)
  // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
  // to MongoDB.
  doc2.save();
  Rabbits.findOneAndUpdate(
    {
      Name: literData.litterinputs.Mother,
    },
    {
      $set: {
        DateReadyToBreed: moment(literData.litterinputs.Born).add(56, "days"),
      },
    },
    {
      upsert: true,
    },
    {
      new: true,
    } // Return the updated document
  )
    .then((user) => {
      // console.log("UPDATED")
      // console.log(user)
      res.status(200).end();
    })
    .catch((e) => {
      // console.log(e)
    });
});
router.post("/newBreeder", function (req, res) {
  let breederData = req.body;
  //console.log(typeof(literData))
  // console.log(literData)
  //// console.log(literData.Father)
  const doc = new Breeders();
  doc.Address = breederData.breederinputs.Address;
  doc.Name = breederData.breederinputs.Name;
  doc.Farm = breederData.breederinputs.Farm;
  doc.City = breederData.breederinputs.City;
  doc.State = breederData.breederinputs.State;
  doc.Zip = breederData.breederinputs.Zip;
  doc.Phone = breederData.breederinputs.Phone;
  doc.Note = breederData.breederinputs.Note;
  doc.Email = breederData.breederinputs.Email;

  // Mongoose sends an `updateOne({ _id: doc._id }, { $set: { name: 'foo' } })`
  // to MongoDB.
  doc.save();

  res.status(200).end();
});
router.post("/addKidToLitter", function (req, res) {
  let kidData = req.body;
  let litterID = kidData.LitterID;
  let KidID = kidData.KidID.toString();
  async function findLitterById(litterID) {
    try {
      const litter = await Litters.findById(litterID);
      if (!litter) {
        // console.log('User not found.');
        return null;
      }
      litter.Kids.push({
        KidID: KidID,
        Sex: kidData.Sex,
      });
      litter.save();
    } catch (error) {
      console.log(error);
    }
  }
  findLitterById(litterID);

  res.status(200).end();
});
let ReadyToBreed = [];
router.get("/getReadyToBreed/", async function (req, res, next) {
  // main();
  res.send(ReadyToBreed).end();
});
setInterval(() => {
  Rabbits.find().then((items) => {
    items.map((rabbit) => {
      if (rabbit.Sex === "Doe") {
        let dateBorn = rabbit.Date_Born;
        let today = moment().local();
        let age = today.diff(dateBorn, "days");
        if (rabbit.Mated.length == 0 && age > 60) {
          ReadyToBreed.push({
            Doe: rabbit.Name,
            ReadyToBreed: true,
            CanBreed: moment().local(),
          });

          Rabbits.findOneAndUpdate(
            {
              Name: rabbit.Name,
            },
            {
              $set: {
                ReadyToBreed: true,
                DateReadyToBreed: rabbit.DateReadyToBreed,
              },
            },
            {
              upsert: true,
            },
            {
              new: true,
            }
          )
            .then((rabbit) => {
              // console.log("UPDATED")
              // console.log(rabbit)
              res.status(200).end();
            })
            .catch((e) => {
              // console.log(e)
            });
        }
        const date1 = moment(rabbit.DateReadyToBreed).local();
        const date2 = moment();
        const diff = date1.diff(date2, "days");
        if (diff > 0) {
          ReadyToBreed.push({
            Doe: rabbit.Name,
            ReadyToBreed: false,
            CanBreed: diff,
          });
          Rabbits.findOneAndUpdate(
            {
              Name: rabbit.Name,
            },
            {
              $set: {
                ReadyToBreed: false,
                DateReadyToBreed: rabbit.DateReadyToBreed,
              },
            },
            {
              upsert: true,
            },
            {
              new: true,
            }
          )
            .then((rabbit) => {
              // console.log("UPDATED")
              // console.log(rabbit)
              res.status(200).end();
            })
            .catch((e) => {
              // console.log(e)
            }); // Return the updated document
        }
        if (diff === 0) {
          ReadyToBreed.push({
            Doe: rabbit.Name,
            ReadyToBreed: true,
            CanBreed: moment().local(),
          });
          Rabbits.findOneAndUpdate(
            {
              Name: rabbit.Name,
            },
            {
              $set: {
                ReadyToBreed: true,
                DateReadyToBreed: rabbit.DateReadyToBreed,
              },
            },
            {
              upsert: true,
            },
            {
              new: true,
            }
          )
            .then((rabbit) => {
              // console.log("UPDATED")
              // console.log(rabbit)
              res.status(200).end();
            })
            .catch((e) => {
              // console.log(e)
            });

          // Return the updated document
        }
      }
    });
  });
}, 10000);
module.exports = router;
