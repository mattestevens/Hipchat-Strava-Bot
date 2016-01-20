var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
	response.render('pages/index');
});

 app.post('/test',function(request,response){
	response.writeHead(200, {"Content-Type": "application/json"});
	var json = JSON.stringify({"color":"green","message":request.body["item"]["message"]["from"]["mention_name"],"notify":false,"message_format":"text"});
	response.end(json);
});

app.post('/strava', function(request, response){
	stravaScoreboard(request, response, 150858, process.env.hipChatCyclingTest);
});

app.post('/running', function(request, response){
	stravaScoreboard(request, response, 178970, process.env.hipChatRunning);
});

app.post('/cycling', function(request, response){
	stravaScoreboard(request, response, 150858, process.env.hipChatCycling);
});

function stravaScoreboard(request, response, stravaClub, hipChatPostURL){
	var request = require('request');
	var options = {
		url: 'https://www.strava.com/api/v3/clubs/' + stravaClub + '/activities', 	
		headers: {
			'Authorization': 'Bearer ' + process.env.StravaToken
		}
	};

	request.get(options, function (error, response, body) {
	
		if (!error && response.statusCode == 200) {
			var bodyJson = JSON.parse(body);
			var athleteRanking = []; 
			var stravaResponse = "";
			var oneWeekAgo = new Date();
			oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
			
			for (a=0; a<bodyJson.length; a++){
				var tempDate = new Date(bodyJson[a]["start_date"]);
				if (tempDate > oneWeekAgo){
					var distanceInMiles = ((bodyJson[a]["distance"])/1609.3); //.toFixed(1);
					var athleteID = bodyJson[a]["athlete"]["id"].toString();
					for (b=0; b<athleteRanking.length; b++ ){
						if (athleteRanking[b].id === athleteID){
							athleteRanking[b].distanceInMiles = athleteRanking[b].distanceInMiles + distanceInMiles;
							athleteID = 0; 
						} 
					}
					if (athleteID != 0){
						var name = bodyJson[a]["athlete"]["firstname"].toString();
						athleteRanking.push( {id: athleteID, distanceInMiles: distanceInMiles, name: name});
					}
				}
			}
			for (c = 0; c<athleteRanking.length; c++){
				stravaResponse = stravaResponse + (athleteRanking[c].name).toString() + ": " + ((athleteRanking[c].distanceInMiles).toFixed(1)).toString() + "mi \r"; 
			}
			
			var request = require('request');
			var options = {
				uri: hipChatPostURL,
				method: 'POST',
				json: {
					"color":"gray",
					"message":stravaResponse,
					"notify":false,
					"message_format":"text"
				}
			};
			request(options, function (error, response, body) {
				if (!error && response.statusCode == 204) {
					console.log("Successfuly posted to Hipchat, received a 204 back.");
				} else {
					console.log("Failed to post to HipChat. Post response HTTP status code is: ", response.statusCode);
					console.log("Message to be posted was: ", JSON.stringify(stravaResponse));
				}
			});
			
		} else {
			console.log("Error", response.statusCode);
			console.error(error);
		}
		
	});
	response.writeHead(200);
	response.end();
}
	
app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});


