const dotenv = require("dotenv").config();

const express = require("express"),
    bodyParser = require("body-parser");
uuid = require("uuid");
http = require("http"),
    url = require("url"),
    morgan = require("morgan"),
    mongoose = require("mongoose"),
    { check, validationResult } = require("express-validator");
// Imports model.js mongoose schema to project
const Models = require("./models.js"),
    Movies = Models.Movie,
    Users = Models.User;
// Connects mongoose with the DB
// mongoose.connect("mongodb://localhost:27017/myFlixDB", { useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("common"));
app.use(express.static('public'));

// CORS

let allowedOrigins = ["http://localhost:8080", "http://testsite.com"];
let allowedOrigins = ["http://localhost:8080"];

const cors = require("cors");
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) { // If a specific origin is not found on the list of allowed origins
            let message = "The CORS policy for this application doesn't allow access from origin " + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));
// Imports auth to project.
let auth = require("./auth")(app);
//Imports passport to project
const passport = require("passport");
require("./passport");
// Get all movies
app.get("/movies", (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(200).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});
// Get movie by title
app.get("/movies/:Title", (req, res) => {
    Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            if (movie) {
                res.status(200).json(movie);
            } else {
                res.status(404).send(req.params.Title + " was not found.")
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});
// Gets the data about a genre, by name
app.get("/movies/genre/:GenreName", (req, res) => {
    Movies.findOne({ "Genre.Name": req.params.GenreName })
        .then((genre) => {
            if (genre) {
                res.status(200).json(genre.Genre);
            } else {
                res.status(404).send(req.params.GenreName + " was not found.")
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});
// Gets the data about the director, by name
app.get("/movies/director/:DirectorName", (req, res) => {
    Movies.findOne({ "Director.Name": req.params.DirectorName })
        .then((director) => {
            if (director) {
                res.status(200).json(director.Director);
            } else {
                res.status(404).send(req.params.DirectorName + " was not found.")
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});
// Allows new user to register
/* We'll expect JSON in this format
{
  Username: String, (required)
  Password: String, (required)
  Email: String, (required)
  Birthday: Date
}*/
app.post("/users",
    [
        check("Username", "Username is required").isLength({ min: 5 }), // THIS
        check("Username", "Username contains non alphanumeric characters - not allowed").isAlphanumeric(),
        check("Password", "Password is required").not().isEmpty(), // AND THIS SAME THING
        check("Email", "Email does not appear to be valid").isEmail()
    ], (req, res) => {
        //Check the validation object for errors
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOne({ Username: req.body.Username })
            .then((user) => {
                if (user) {
                    return res.status(400).send(req.body.Username + " already exists");
                } else {
                    Users
                        .create({
                            Username: req.body.Username,
                            Password: hashedPassword,
                            Email: req.body.Email,
                            Birthday: req.body.Birthday
                        })
                        .then((user) => { res.status(201).json(user) })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).send("Error: " + err);
                        });
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send("Error: " + err);
            });
    });
// Get all users
app.get("/users", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.find()
        .then((users) => {
            res.status(200).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});
// Get Username by name
app.get("/users/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOne({ Username: req.params.Username })
        .then((user) => {
            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).send(req.params.Username + " was not found.")
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});
// Allows users to update their username
/* We´ll expect JSON in this format
{
  Username: String, (required)
  Password: String, (required)
  Email: String, (required)
  Birthday: Date
}*/
app.put("/users/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
        $set:
        {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        }
    },
        { new: true }, // This line makes sure that the updated document is returned
        (err, updatedUser) => { // Alternative way for .then .catch
            if (err) {
                console.error(err);
                res.status(500).send("Error: " + err);
            } else {
                res.status(200).json(updatedUser);
            }
        });
});
// Add a movie to a user list of favorites
app.post("/users/:Username/movies/:MovieID", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username },
        { $push: { FavoriteMovies: req.params.MovieID } },
        { new: true }, // This line makes sure that the updated document is returned
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send("Error: " + err);
            } else {
                res.status(200).send("The movie has been added succesfully");
            }
        });
});
// Removes a movie from a user list of favorites
app.delete("/users/:Username/movies/:MovieID", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username },
        { $pull: { FavoriteMovies: req.params.MovieID } },
        { new: true },
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send("Error: " + err);
            } else {
                res.status(200).send("The movie has been removed succesfully");
            }
        });
});
// Delete a user by username
app.delete("/users/:Username", passport.authenticate("jwt", { session: false }), (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + " was not found.");
            } else {
                res.status(200).send(req.params.Username + " was deleted.");
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
        });
});
// Shows home page
app.get("/", (req, res) => {
    res.send("Welcome to my Movies API!");
});
// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});
// Port
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Your app is listening on port ${port}.`);
});


