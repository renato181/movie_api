const express = require('express'),
  bodyParser = require('body-parser'),
  uuid = require ('uuid');

const morgan = require('morgan');
const app = express();
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

const { check, validationResult } = require('express-validator');

// mongoose.connect('mongodb://localhost:27017/myFlixDB', 
// { useNewUrlParser: true, 
//  useUnifiedTopology: true });

// mongoose.connect('mongodb+srv://Boston:Beantown@renatodb.dhhj6.mongodb.net/myFlixDB?retryWrites=true&w=majority', 
// { useNewUrlParser: true, 
// useUnifiedTopology: true });

mongoose.connect( process.env.CONNECTION_URI, 
    { useNewUrlParser: true, useUnifiedTopology: true });


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors');
app.use(cors());

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

app.use(morgan('common'))

// GET requests
app.get('/',(req,res) => {
    res.send('Welcome to my 80\'s movies!');
});

app.get('/movies', function (req, res)  {
    Movies.find()
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


app.get('/movies/:Title', passport.authenticate('jwt', { session: false }),
    (req, res) => {
    Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            if (movie === null){
                res.status(404).send("No movie found")
            } else {
                res.json(movie);
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


app.get('/genres/:Name', passport.authenticate('jwt', { session: false }),
    (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.Name })
        .then((movie) => {
            if (movie === null){
                res.status(404).send("No genre found")
            } else {
                res.json(movie.Genre);
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

app.get('/directors/:Name', passport.authenticate('jwt', { session: false }),
    (req, res) => {
    Movies.findOne({ "Director.Name": req.params.Name })
        .then((movie) => {
            if (movie === null){
                res.status(404).send("No director found")
            } else {
                res.json(movie.Director);
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});


app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});


// Get all users
app.get('/users', passport.authenticate('jwt', { session: false }),
    (req, res) => {
    Users.find()
        .then((users) => {
            res.json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Get a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }),
    (req, res) => {
    Users.findOne({ Username: req.params.Username })
        .then((user) => {
            if (user === null){
                res.status(404).send("No user found")
            } else {
                res.json(user);
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Add new user
app.post('/users',
  // Validation logic here for request
  //you can either use a chain of methods like .not().isEmpty()
  //which means "opposite of isEmpty" in plain english "is not empty"
  //or use .isLength({min: 5}) which means
  //minimum value of 5 characters are only allowed
  [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], (req, res) => {

  // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          //If the user is found, send a response that it already exists
          return res.status(400).send(req.body.Username + ' already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => { res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });

// Update a user's info, by username
/* We’ll expect JSON in this format
{
  Username: String,
  (required)
  Password: String,
  (required)
  Email: String,
  (required)
  Birthday: Date
}*/
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
    (req, res) => {
    Users.findOneAndUpdate(
        { Username: req.params.Username },
        { $set: {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        }},
        { new: true }, // This line makes sure that the updated document is returned
    )
        .then((user) => {
            if (user === null){
                res.status(404).send("No user found")
            } else {
                res.json(user);
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
    });

// Add a movie to a user's list of favorites
app.post('/users/:Username/movies/:MovieID',
    passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
            $push: { FavoriteMovies: req.params.MovieID }
        },
        { new: true }, // This line makes sure that the updated document is returned
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error: ' + err);
            } else {
                res.json(updatedUser);
            }
        });
});

// Remove a movie to a user's list of favorites
app.delete('/users/:Username/movies/:MovieID',
    passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
            $pull: { FavoriteMovies: req.params.MovieID }
        },
        { new: true }, // This line makes sure that the updated document is returned
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error: ' + err);
            } else {
                res.json(updatedUser);
            }
        });
});

// Delete a user by username
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }),
    (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + ' was not found');
            } else {
                res.status(200).send(req.params.Username + ' was deleted.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Unregister a user by username
app.delete('/users/:Username/:user/:deregister', passport.authenticate('jwt', { session: false }),
    (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + ' was not found');
            } else {
                res.status(200).send(req.params.Username + ' has unregistered.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

app.use((err, req, res, next) => { //error handling
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(express.static('public', {
  extensions: ['html'],
}));

// listen for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});


