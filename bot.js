var HTTPS = require('https');
var cool = require('cool-ascii-faces');

var botID = process.env.BOT_ID;
var key = process.env.BREWDB_KEY;

function Beer () {
  this.name = "";
  this.description = "";
  this.abv = ""
  this.img = "";
}

function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      botRegex = /^\/beer/;
  console.log("botRegex " + botRegex);
  console.log("text: " + request.text);

  var message = request.text.replace("\/beer ", "");
  console.log("msg: " + message);

  if(request.text && botRegex.test(request.text)) {
    this.res.writeHead(200);

    //postMessage(message);
    getBeer(message);
    this.res.end();
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function postMessage(message) {
  var botResponse, options, body, botReq;

  botResponse = message;

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
  };

  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}

function getBeer(message) {
  //https://api.brewerydb.com/v2/beers/?key=bc25b64bb0d92491fdc8be4ac52e9a89&name=dos equis special
  var beers = [];
  HTTPS.get("https://api.brewerydb.com/v2/beers/?key="+key+"&name="+message, function(res) {
    console.log("Got response: " + res.statusCode);
    console.log("Response: " + res);
    var body = '';

    res.on('data', function(data) {
      body += data;
    });

    res.on('end', function() {

      console.log("Body: " + body);

      // Data reception is done, do whatever with it!
      var parsed = JSON.parse(body);

      //Return if data is not found
      if(parsed.data == null){
          console.log("Data is null");
          searchBeer(message);
          return;
      }

      for(var i = 0; i < parsed.data.length; i++){
        var beer = new Beer();
        beer.name = parsed.data[i].name;
        beer.description = parsed.data[i].description;
        beer.img = parsed.data[i].labels.medium;
        beer.abv = parsed.data[i].abv;

        beers.push(beer);
      }
      matchBeer(message, beers);

    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
}

function searchBeer(message) {
    //https://api.brewerydb.com/v2/beers/?key=bc25b64bb0d92491fdc8be4ac52e9a89&name=dos equis special
    var beers = [];
    HTTPS.get("https://api.brewerydb.com/v2/search/?key="+key+"&q="+message, function(res) {
        console.log("Got response: " + res.statusCode);
        console.log("Response: " + res);
        var body = '';

        res.on('data', function(data) {
            body += data;
        });

        res.on('end', function() {

            console.log("Body: " + body);

            console.log("GitHub working!");

            // Data reception is done, do whatever with it!
            var parsed = JSON.parse(body);

            //Return if data is not found
            if(parsed.data == null){
                console.log("Search Beer: Data is null");
                return;
            }

            var suggestions = "";
            for(var i = 0; i < parsed.data.length; i++){
                var beer = new Beer();
                beer.name = parsed.data[i].name;
                beer.description = parsed.data[i].description;
                beer.img = parsed.data[i].labels.medium;
                beer.abv = parsed.data[i].abv;

                if(i < parsed.data.length-1){
                  suggestions += parsed.data[i].name+", ";
                }
                else{
                  suggestions += "or " + parsed.data[i].name;
                }

                beers.push(beer);
            }

            var feedback = "The beer \'"+message+"\' was not found. Perhaps you meant to type "+suggestions;
            //matchBeer(message, beers);

        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}

//Check to see if query was successful
function matchBeer(message, beers){
    console.log("Beer: ");

    for(var i = 0; i < beers.length; i++){
        var beer = beers[i];
        console.log("Name: " + beer.name);
        console.log("img: " + beer.img);
        console.log("Abv: " + beer.abv);

        if(message.toUpperCase() === beer.name.toUpperCase()){
            postMessage(beer.description);
        }
    }
}

exports.respond = respond;