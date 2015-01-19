var Twit = require('twit');
//var GitHubApi = require('github');
var request = require('request');


var options = {
  url: 'https://api.github.com/repos/SalesforceFoundation/Cumulus/events',
  headers: {'user-agent': 'node.js',
            'X-Poll-Interval': '60',
            'etag': ''
            //'access_token': process.env.GITHUB_ACCESS_TOKEN
  }
};


var etag = '';
var POLLING_INTERVAL = 1000;

function callback() {
  console.log('Setting header to: ' + etag);
  options.headers['If-None-Match'] = etag;

  request(options, function (error, response, body) {
    if (error){
      console.log('ERROR');
      console.log(error);
    }else{
      console.log(response.headers);
      //respect the rate limit
      if (response.headers['x-poll-interval']){
        POLLING_INTERVAL =  response.headers['x-poll-interval'] * 1000;
      }
      else{
        POLLING_INTERVAL = 60000;
      }

      if (response.statusCode == 200){
        //parse body and tweet when ready
        console.log('Returned 200');
        var event_body = JSON.parse(body);
        var event_type = '';

        var T = new Twit({
          consumer_key:         process.env.CONSUMER_KEY,
          consumer_secret:      process.env.CONSUMER_SECRET,
          access_token:         process.env.ACCESS_TOKEN,
          access_token_secret:  process.env.ACCESS_TOKEN_SECRET
        });


        for (var i=0; i < event_body.length; i++){
          event_type = event_body[i]['type'];
          //always tweet a release
          if (event_type == 'ReleaseEvent'){
            T.post('statuses/update', { status: 'Release ' + event_body[i]['payload']['release']['name'] + " now available at " + event_body[i]['payload']['release']['html_url']}, function(err, data, response) { });

          } else if (event_type == 'CreateEvent'){
            //not used on repo events
          } else if (event_type == 'IssuesEvent' && event_body.length === 1){
            //only tweet an issue if its new
          } else if(event_type == 'PublicEvent'){

          } else if(event_type == 'PullRequestEvent' && event_body.length === 1){
            //tweet a pull request if its new
          } else {

          }
        }

        //set the new etag
        etag = response.headers['etag'];

      } else if (response.statusCode == 304){
        //do something random if too much
        //time has gone by
        console.log('Returned 304');

        //check Hub for popular questions or
        //new knowledge articles
        var nforce = require('nforce');

        var org = nforce.createConnection({
          clientId: 'SOME_OAUTH_CLIENT_ID',
          clientSecret: 'SOME_OAUTH_CLIENT_SECRET',
          redirectUri: 'http://localhost:3000/oauth/_callback',
          apiVersion: 'v27.0',  // optional, defaults to current salesforce API version
          environment: 'production',  // optional, salesforce 'sandbox' or 'production', production default
          mode: 'multi' // optional, 'single' or 'multi' user mode, multi default
        });



      } else {
        console.log('RETURNED A ' + response.statusCode);
      }
    }
  });

  console.log('SETTING TIMEOUT TO: ' + POLLING_INTERVAL);
  setTimeout(callback, POLLING_INTERVAL);
}

  setTimeout(callback, POLLING_INTERVAL);






/*
var github = new GitHubApi({
  version: "3.0.0",
  protocol: "https"
});

var msg = {headers: {}, user: 'SalesforceFoundation', repo: 'Cumulus'};

github.events.getFromRepo(msg, function(error, data){
  console.log(data.headers);
  console.log(JSON.stringify(data));


})*/






/*

$ curl -I https://api.github.com/users/tater/events
HTTP/1.1 200 OK
X-Poll-Interval: 60
ETag: "a18c3bded88eb5dbb5c849a489412bf3"

# The quotes around the ETag value are important
$ curl -I https://api.github.com/users/tater/events \
-H 'If-None-Match: "a18c3bded88eb5dbb5c849a489412bf3"'
HTTP/1.1 304 Not Modified
X-Poll-Interval: 60

*/
