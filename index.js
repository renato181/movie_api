const express = require('express'),
  bodyParser = require('body-parser'),
  uuid = require ('uuid');

const morgan = require('morgan');
const app = express();
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;

mongoose.connect('mongodb://localhost:27017/myFlixDB', 
{ useNewUrlParser: true, 
  useUnifiedTopology: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

app.use(morgan('common'))

app.get('/', passport.authenticate('jwt', { session: false }),
    (req, res) => {
    res.send('Welcome to my 80\'s movies!');
});

// GET requests
app.get('/', passport.authenticate('jwt', { session: false }),
    (req, res) => {
    res.send('Welcome to my 80\'s movies!');
});

app.get('/movies', passport.authenticate('jwt', { session: false }),
    (req, res) => {
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
app.post('/users', (req, res) => {
  Users.findOne({ Username: req.body.Username })
      .then((user) => {
          if (user) {
              return res.status(400).send(req.body.Username + ' already exists');
          } else {
              Users
                  .create({
                      Username: req.body.Username,
                      Password: req.body.Password,
                      Email: req.body.Email,
                      Birthday: req.body.Birthday
                  })
                  .then((user) => {
                      res.status(201).json(user);
                  })
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
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});

