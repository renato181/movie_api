const express = require('express'),
  morgan = require('morgan');

const app = express();

let topMovies = [
  {
    title: 'Aliens',
    director: 'James Cameron'
  },
  {
    title: 'River\'s Edge',
    director: 'Tim Hunter'
  },
  {
    title: 'Platoon',
    director: 'Oliver Stone'
  },
  {
    title: 'Blue Velvet',
    director: 'David Lynch'
  },
  {
    title: 'Stand By Me',
    director: 'Rob Reiner'
  },
  {
    title: 'Labyrinth',
    director: 'Jim Henson'
  },
  {
    title: 'Manhunter',
    director: 'Michael Mann'
  },
  {
    title: 'The Hitcher',
    director: 'Robert Harmon'
  },
  {
    title: 'Salvador',
    director: 'Oliver Stone'
  },
  {
    title: 'The Color of Money',
    director: 'Martin Scorsese'
  },
  
];

app.use(express.static('public'));

// GET requests
app.get('/', (req, res) => {
  res.send('Welcome to my 80\'s movies!');
});

app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});

app.get('/movies', (req, res) => {
  res.json(topMovies);
});


// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});

