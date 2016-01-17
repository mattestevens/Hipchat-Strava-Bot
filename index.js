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

app.post('/strava',function(request,response){

	var request = require('request');
	var options = {
		url: 'https://www.strava.com/api/v3/clubs/150858/activities',
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
					//if (!athleteRanking[athleteID]){
					//	athleteRanking[athleteID] = 0;
					//}
					//athleteRanking[athleteID] = athleteRanking[athleteID] + distanceInMiles;
					for (b=0; b<athleteRanking.length; b++ ){
						if (athleteRanking[b].id === athleteID){
							athleteRanking[b].distanceInMiles = athleteRanking[b].distanceInMiles + distanceInMiles;
							athleteID = 0; 
						} 
					}
					if (athleteID != 0){
						console.log("pushing: ", athleteID);
						switch (parseInt(athleteID)) {
							case 6985116:
								var name = "Alex";
								break;
							case 6882962:
								var name = "Tim";
								break;
							case 380249:
								var name = "Hans";
								break;
							case 415235:
								var name = "Michael";
								break;
							case 7016430:
								var name = "Julie";
								break;
							case 664571:
								var name = "Matt";
								break;
							case 895931:
								var name = "Amber";
								break;
							default:
								var name = athleteID;
						}
						athleteRanking.push( {id: athleteID, distanceInMiles: distanceInMiles, name: name});
					}
					//stravaResponse = stravaResponse + "\r" + athleteID + ": " + (distanceInMiles).toString(); 
				}
			}
			for (c = 0; c<athleteRanking.length; c++){
				console.log("we're on item ", c);
				stravaResponse = stravaResponse + (athleteRanking[c].name).toString() + ": " + ((athleteRanking[c].distanceInMiles).toFixed(1)).toString() + "mi \r"; 
			}
			
			var request = require('request');
			var options = {
				uri: 'https://ql.hipchat.com/v2/room/2317660/notification?auth_token=' + process.env.hipChatToken,
				method: 'POST',
				json: {
					"color":"green",
					"message":stravaResponse,
					"notify":false,
					"message_format":"text"
				}
			};

			request(options, function (error, response, body) {
				if (!error && response.statusCode == 204) {
					console.log("Success"); // Print the shortened url.
				} else {
					console.log("Failed to post to HipChat. Post response HTTP status code is: ", response.statusCode);
					console.log("Hipchat message was: ", JSON.stringify(stravaResponse));
				}
			});
			
		} else {
			console.log("Error", response.statusCode);
			console.error(error);
		}
		
	});
	response.writeHead(200);
	response.end();
});

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});


