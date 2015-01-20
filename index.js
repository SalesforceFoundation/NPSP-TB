var Twit = require('twit');
var request = require('request');

var options = {
  url: 'https://api.github.com/repos/SalesforceFoundation/Cumulus/events',
  headers: {'user-agent': 'node.js',
            'X-Poll-Interval': '60',
            'etag': ''
  }
};


var etag = '';
var POLLING_INTERVAL = 1000;
var modified_since = '';

function callback() {
  console.log('<---------- START ---------->');

  options.headers['If-None-Match'] = etag;
  options.headers['If-Modified-Since'] = modified_since;

  request(options, function (error, response, body) {
    if (error){
      console.log('!!!!!!!!!!ERROR!!!!!!!!!!');
      console.log(error);
    }else{
      console.log('Processing request response...');
      console.log(response.headers['x-ratelimit-remaining'] + ' remaining of ' + response.headers['x-ratelimit-limit'] + ' requests');
      modified_since = options.headers['Last-Modified'];

      //respect the rate limit
      if (response.headers['x-poll-interval']){
        POLLING_INTERVAL =  response.headers['x-poll-interval'] * 1000;
      }
      else{
        POLLING_INTERVAL = 60000;
      }

      console.log('GITHUB REQUEST STATUS: ' + response.statusCode);
      if (response.statusCode == 200){
        //parse body and tweet when ready

        var event_body = JSON.parse(body);
        var event_type = '';

        for (var i=0; i < event_body.length; i++){
          event_type = event_body[i].type;

          var status_message = '';
          //always tweet a release
          if (event_type == 'ReleaseEvent'){
            if (event_body[i].payload.release.prerelease === true){
              status_message = 'A beta release ' + event_body[i].payload.release.name + " for sandboxes and DE orgs is now available at " + event_body[i].payload.release.html_url;
            }else{
              status_message = '' + event_body[i].payload.release.name + ' is now available! Notes & links here: ' + event_body[i].payload.release.html_url;
            }

            status_message = 'Release ' + event_body[i].payload.release.name + " now available at " + event_body[i].payload.release.html_url;
            console.log('TWITTER POST:  ReleaseEvent ' + event_body[i].payload.release.name);
            twitterUpdate(status_message);

          } else if (event_type == 'CreateEvent'){
            //not used on repo events
          } else if (event_type == 'IssuesEvent' && event_body.length === 1){
            //only tweet an issue if its new
          } else if(event_type == 'PublicEvent'){

          } else if(event_type == 'PullRequestEvent'){
            //only tweet non-merge-back and closed to dev pull requests
            var title = event_body[i].payload.pull_request.title;
            if (event_body[i].payload.action === "closed" && event_body[i].payload.pull_request.merged === true && title.substr(0,22) !== 'Merge conflict merging'){
              console.log('TWITTER POST: PullRequestClosed ' + title);
              status_message = 'New code added to the main code line!  Check it out: ' + event_body[i].payload.pull_request.html_url;
              twitterUpdate(status_message);
            }
          } else {

          }
        }
        //set the new etag
        etag = response.headers.etag;
        modified_since = response.headers['last-modified'];

      } else if (response.statusCode == 304){
        //do something random if too much
        //time has gone by

/*
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

*/

      } else {
        console.log('Unexpected response code: ' + response.statusCode);
      }

      //set the schedule
      console.log('Checking again in ' + ((POLLING_INTERVAL + 3000)/1000) + ' seconds.');
      setTimeout(callback, POLLING_INTERVAL + 3000);
      console.log('<---------- END ---------->');
    }
  });
}

  setTimeout(callback, POLLING_INTERVAL);

  function twitterUpdate(status_message){
    var T = new Twit({
      consumer_key:         process.env.CONSUMER_KEY,
      consumer_secret:      process.env.CONSUMER_SECRET,
      access_token:         process.env.ACCESS_TOKEN,
      access_token_secret:  process.env.ACCESS_TOKEN_SECRET
    });
    T.post('statuses/update', { status: status_message },   function (err, data, response) {

        if (err !== null){
          console.log('TwitterError: ' + err);
        }else {
          console.log('TwitterPostSuccess');
        }
    });
  }
