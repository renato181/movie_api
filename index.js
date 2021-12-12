const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  uuid = require ('uuid');

const app = express();

app.use(bodyParser.json());

let movies = [
  {
    title: 'Aliens',
    director: {
      name: 'James Cameron',
      birth: '1954',
      died: 'still alive',
    },
    genre: 'Sci-Fi'
  },
  {
    title: 'River\'s Edge',
    director: {
      name: 'Tim Hunter',
      born: 1947,
      died: 'still alive'
    },
    genre: 'Crime'
  },
  {
    title: 'Platoon',
    director: {
      name: 'Oliver Stone',
      born: 1946,
      died: 'still alive'
    },
    genre: 'War'
  },
  {
    title: 'Blue Velvet',
    director: {
      name: 'David Lynch',
      born: 1946,
      died: 'still alive'
    },
    genre: 'Mystery'
  }, 
  {
    title: 'Stand By Me',
    director: {
      name: 'Rob Reiner',
      born: 1947,
      died: 'still alive'
    },
    genre: 'Adventure'
  },
  {
    title: 'Labyrinth',
    director: {
      name: 'Jim Henson',
      born: 1936,
      died: 1990
    },
    genre: 'Fantasy'
  },
  {
    title: 'Manhunter',
    director: {
      name: 'Michael Mann',
      born: 1943,
      died: 'still alive'
    },
    genre: 'Crime'
  },
  {
    title: 'The Hitcher',
    director: {
      name: 'Robert Harmon',
      born: 1953,
      died: 'still alive'
    },
    genre: 'Thriller'
  },
  {
    title: 'Salvador',
    director: {
      name: 'Oliver Stone',
      born: 1946,
      died: 'still alive'
    },
    genre: 'History'
  },
  {
    title: 'The Color of Money',
    director: {
      name: 'Martin Scorcese',
      born: 1942,
      died: 'still alive'
    },
    genre: 'Sport'
  },
  
];

app.use(express.static('public'));

// GET requests
app.get('/', (req, res) => {
  res.send('Welcome to my 80\'s movies!');
});

app.get('/movies', (req, res) => {
  res.status(200).json(movies);
});

app.get('/movies/:title', (req, res) => {
  res.status(200).json(movies.find((movie) => {
      return movie.title === req.params.title
  }));
});


app.get('/genres/:genre', (req, res) => {
  res.status(200).json(movies.find((genres) => {
    return genres.genre === req.params.genre
  }));
});

app.get('/directors/:directorName', (req, res) => {
  res.status(200).json(movies.find((director) => {
      return director.director.name === req.params.directorName
  })) 
})


app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});


app.get('/users', (req, res) => {
  res.send('current users')
});

// Add new user
app.post('/users/:username', (req, res) => {
  res.send('user added')
});

app.delete('/users/:delete', (req, res) => {
  res.send('user deleted')
});

app.post('/users/:username/:add', (req, res) => {
  res.send('user added a favorite movie')
});

app.delete('/users/:username/:remove', (req, res) => {
  res.send('user deleted a favorite movie')
});

app.delete('/users/:deregister', (req, res) => {
  res.send('user unregistered')
});


// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});

