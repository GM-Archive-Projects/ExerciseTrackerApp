require("dotenv").config();

const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");

morgan.token("body", function (req, res) {
	return JSON.stringify(req.body);
});

morgan.token("date", function (req, res) {
	return new Date().toISOString().substring(0, 10);
});

//Morgan Middleware Function To Log Request Details
app.use(
	morgan(
		"Morgan Token =  :method :url :status :res[content-length] - :response-time ms :body :date"
	)
);
// const bodyParser = require('body-parser')

const cors = require("cors");
// app.use(express.json())
const mongoose = require("mongoose");
const { response } = require("express");
let uri = `mongodb+srv://fullstack:${process.env.PW}@cluster0.wiesv.mongodb.net/${process.env.DBName}?retryWrites=true&w=majority`;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, () =>
	console.log(`Connecting to DB => ${process.env.DBName}`)
);

app.use(cors());

app.use(express.static("public"));
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Your app is listening on port " + listener.address().port);
});

const exerciseSessionSchema = new mongoose.Schema({
	description: {
		type: String,
		minlength: 2,
		required: true,
	},
	duration: {
		type: Number,
		required: true,
	},
	date: String,
});

let userSchema = new mongoose.Schema({
	username: { type: String, required: true },
	log: [exerciseSessionSchema],
});

userSchema.set("toJSON", {
	transform: (document, returnedObject) => {
		delete returnedObject.__v;
	},
});

let Session = mongoose.model("Session", exerciseSessionSchema);
let User = mongoose.model("User", userSchema);

app.post(
	"/api/exercise/new-user",
	bodyParser.urlencoded({ extended: false }),
	(req, res) => {
		let newUser = new User({ username: req.body.username });
		newUser.save((err, savedUser) => {
			if (!err) {
				let responseObject = {};
				responseObject = {
					_id: savedUser.id,
					username: savedUser.username,
				};
				res.json(responseObject);
			}
		});
	}
);

app.post(
	"/api/exercise/add",
	bodyParser.urlencoded({ extended: false }),
	(req, res) => {
		let newSession = new Session({
			description: req.body.description,
			duration: parseInt(req.body.duration),
			date: req.body.date
		});
		if (newSession.date === "") {
			newSession.date = new Date().toISOString().substring(0, 10);
		}
		User.findByIdAndUpdate(
			req.body.userId,
			{ $push: { log: newSession } },
			{ new: true },
			(err, updatedUser) => {
				let responseObject = {};
				responseObject = {
					_id: updatedUser.id,
					username: updatedUser.username,
					date: new Date(newSession.date).toDateString(),
					description: newSession.description,
					duration: newSession.duration,
				};
				res.json(responseObject);
			}
		);
	}
);

app.get("/api/exercise/users", (req, res) => {
	User.find({}, (err, usersArr) => {
		if (!err) {
			res.json(usersArr);
		}
	});
});


app.use(express.json())
app.get("/api/exercise/log", (req, res) => {
  User.findById(req.query.userId, (err, result) => {
    if(!err) {
      let responseObject = result
      // responseObject = responseObject.toJSON()

      if(req.query.limit){
        responseObject.log = responseObject.log.slice(0, req.query.limit)
      }
      
      if(req.query.from || req.query.to) {

        let fromDate = new Date(0)
        let toDate = new Date()

        if(req.query.from){
          console.log(req.query.from)
          fromDate = new Date(req.query.from)
          console.log(fromDate)
        }
        if(req.query.to){
          toDate = new Date(req.query.to)
        }


        fromDate = fromDate.getTime()
        console.log(fromDate)

        toDate = toDate.getTime()

        responseObject.log = responseObject.log.filter((session) => {
          let sesssionDate = new Date(session.date).getTime()

          return sesssionDate>= fromDate && sesssionDate <= toDate
        })
      }
      

      responseObject['count'] = result.log.length
      res.json(responseObject)
    }
  })
});