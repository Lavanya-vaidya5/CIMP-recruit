const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
})
.then(() => console.log("✅ MongoDB Atlas connected"))
.catch((err) => console.error("❌ Connection error:", err))


const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Temporary in-memory array to store clubs


const clubSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  logo: String, // for future logo support
  members: [String],
  president: String,
  facultyCoordinator:String
});

const Club = mongoose.model('Club', clubSchema);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ROUTES
app.get("/", async (req, res) => {
  const clubs = await Club.find();
  res.render("dashboard", { clubs });
});

app.get("/create", (req, res) => {
  res.render("create");
});

app.get("/clubs", async (req, res) => {
  const query = req.query.q;
  let clubs;
  if (query) {
    const regex = new RegExp(query, 'i');
    clubs = await Club.find({
      $or: [
        { name: regex },
        { description: regex },
        { category: regex }
      ]
    });
  } else {
    clubs = await Club.find();
  }
  res.render("clubs", { clubs, q: query });
}); //filter



app.post("/clubs/:id/edit", async (req, res) => {
  const { name, description, category, facultyCoordinator } = req.body; // <-- add facultyCoordinator here
  await Club.findByIdAndUpdate(req.params.id, { name, description, category, facultyCoordinator });
  res.redirect("/clubs");
});



app.post("/create", async (req, res) => {
  const { name, description, category, facultyCoordinator} = req.body;
  await Club.create({
    name,
    description,
    category,
    facultyCoordinator,
    members: [],
    president: null
  });
  res.redirect("/clubs");
});

  app.get("/clubs/:id", async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (club) {
    res.render("clubDetail", { club });
  } else {
    res.status(404).send("Club not found");
  }
});

app.get("/clubs/:id/edit", async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (club) {
    res.render("editClub", { club });
  } else {
    res.status(404).send("Club not found");
  }
});


app.post("/clubs/:id/add-member", async (req, res) => {
  const { memberName } = req.body;
  if (memberName) {
    await Club.findByIdAndUpdate(req.params.id, { $push: { members: memberName } });
  }
  res.redirect(`/clubs/${req.params.id}`);
});

// Set president from members
app.post("/clubs/:id/set-president", async (req, res) => {
  const { president } = req.body;
  await Club.findByIdAndUpdate(req.params.id, { president });
  res.redirect(`/clubs/${req.params.id}`);
});
app.delete("/clubs/:id", async (req, res) => {
  await Club.findByIdAndDelete(req.params.id);
  res.redirect("/clubs");
});

  

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
