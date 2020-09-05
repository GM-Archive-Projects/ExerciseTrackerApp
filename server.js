require('dotenv').config()

const express = require('express')
const app = express()
const morgan = require("morgan");
const getDate = require("./utils/getCurrentDateTime");
const bodyParser = require('body-parser')

morgan.token("body", function (req, res) {
	return JSON.stringify(req.body);
});

morgan.token("date", function (req, res) {
	return getDate();
});

//Morgan Middleware Function To Log Request Details
app.use(
	morgan(
		"Morgan Token =  :method :url :status :res[content-length] - :response-time ms :body :date"
	)
);
// const bodyParser = require('body-parser')

const cors = require('cors')
// app.use(express.json())
const mongoose = require("mongoose");
const { response } = require('express');
let uri =`mongodb+srv://fullstack:${process.env.PW}@cluster0.wiesv.mongodb.net/${process.env.DBName}?retryWrites=true&w=majority`
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true },() => console.log(`Connecting to DB => ${process.env.DBName}`))

app.use(cors())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})




const exerciseSessionSchema = new mongoose.Schema({
	description: {
        type: String,
        minlength: 2,
        required: true
	},
	duration: {
        type: Number,
        required: true
    },
    date: String
});

let userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSessionSchema]
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    delete returnedObject.__v
  }
})

let Session = mongoose.model('Session' , exerciseSessionSchema)
let User = mongoose.model('User', userSchema)

app.post('/api/exercise/new-user', bodyParser.urlencoded({ extended: false }), (req, res) => {
  let newUser = new User({username: req.body.username})
  newUser.save((err, savedUser) => {
    if(!err) {
      let responseObject = {}
      responseObject = {
        _id : savedUser.id,
        username: savedUser.username
      }
      res.json(responseObject)
    }
  })
})

app.get('/api/exercise/users', (req, res) => {

  User.find({}, (err, usersArr) => {
    if(!err) {
      res.json(usersArr)
    }
  })
})