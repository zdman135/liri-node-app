var dotenv = require("dotenv").config();
var fs = require('fs');
var moment = require('moment');

var spotifyKeys = require("./keys");
var Spotify = require('node-spotify-api');
var spotify = new Spotify(spotifyKeys.spotify);

var axios = require('axios');

var command, queryName;
var userInput = process.argv.slice(2);

checkUserInput(userInput);

if (userInput[0] === 'do-what-it-says') {
    executeCommand(userInput[0]);
} else {
    command = userInput.shift();
    queryName = userInput.join(" ");
    executeCommand(command);
}


function executeCommand(command) { 
    this['concert-this'] = function() {
        checkIfAdditionalArgsPresent(userInput);
        getBandInfo(queryName);
    }
    this['spotify-this-song'] = function() {
        if (queryName == "") {
            spotifyTheSong()
        } else {
            spotifyTheSong(queryName);
        }
    }
  
    this['movie-this'] = function() {
        if (queryName == "") {
            searchMovie()
        } else {
            searchMovie(queryName);
        }        
    }

    this['do-what-it-says'] = function() {
        fs.readFile('random.txt', (err, data) => {
            if (err) throw err;
            var fileContents = data.toString().split(",");
            fileContents.forEach(function(commandInput) {
                userInput.push(commandInput);
            });
            
            command = userInput.shift();
            queryName = userInput.pop().slice(1,-1);

            executeCommand(command);    
        });        
    } 

    if (typeof this[command] !== 'function') {
        console.log('Command not found. exiting...')
        process.exit(0);  
    }
  
    return this[command]();;
}

function checkUserInput(userInput) {
    if (userInput.length < 1) {
        console.log("A command was not found. Please enter a command. exiting...");
        process.exit(0);
    }
}

function checkIfAdditionalArgsPresent(userInput) {
    if (userInput.length < 1) {
        console.log("Nothing was entered. Please try again entering a value to query. Exiting...");
        process.exit(0);
    }
}

function getBandInfo(artist) {
    var artistEncoded = encodeURI(artist);
    axios.get("https://rest.bandsintown.com/artists/" + artistEncoded + "/events?app_id=codingbootcamp")
        .then(function (response) {
            console.log("For " + artist + ", the following events were found:" + '\n' )
            response.data.forEach(function(event) {
                console.log("Name of the venue: " + event.venue.name);
                console.log("Venue location: " + event.venue.city + ", " + event.venue.region + ", " + event.venue.country);
                console.log("Date of the Event: " + moment(event.datetime).format('MM/DD/YYYY'));
                console.log('\n');
            })
        })
        .catch(function (error) {
            console.log(error);
        });
}    

function spotifyTheSong(songName="The Sign") {
    spotify.search({ type: 'track', query: songName }, function(err, data) {
        if (err) {
            return console.log('Error occurred: ' + err);
        }
        var artistsArray = [];

        console.log("Your song search results:" + '\n');
        
        data.tracks.items.forEach(function(song) {
            song.artists.forEach(function(artist) {
                artistsArray.push(artist.name);
            });
            console.log("Artist(s) for this song: " + artistsArray.join(", "))
            artistsArray = [];

            console.log("Song Name: " + song.name);

            if (song.preview_url === null) {
                console.log("Song Preview Link: N/A");
            } else {
                console.log("Song Preview Link: " + song.preview_url);
            }
            console.log("Album: " + song.album.name);

            console.log('\n');
        });
    });
}

function searchMovie(movieName="Mr. Nobody") {
    axios.get('http://www.omdbapi.com', {
        params: {
          apikey: 'trilogy',
            t: movieName
        }
      })
      .then(function (response) {
        function getMovieRating(response, filter) {
            var ratingObj = response.data.Ratings.filter(obj => {
                return obj.Source === filter
            });
            if (ratingObj != []) {
                return ratingObj[0].Value
            } else {
                return ratingObj = "N/A"
            }
        }

        var rottenTomatoesRating = getMovieRating(response, "Rotten Tomatoes");
        var imdbRating = getMovieRating(response, "Internet Movie Database");

        console.log("Your movie search results:" + '\n')
        console.log("Title: " + response.data.Title);
        console.log("Year released: " + response.data.Released.split(" ").pop());
        console.log("IMBD Rating: " + imdbRating);
        console.log("Rotten Tomatoes Rating: " + rottenTomatoesRating);
        console.log("Country of production: " + response.data.Country);
        console.log("Language: " + response.data.Language);
        console.log("Plot:");
        console.log(response.data.Plot + '\n');
        console.log("Actors: " + response.data.Actors);
        console.log('\n');
      })
      .catch(function (error) {
        console.log(error);
      });
}