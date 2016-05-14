var async= require('async');
var Twitter = require('twitter');
var config = require('config');

var client = new Twitter({
  consumer_key: config.App.Twitter.consumer_key,
  consumer_secret: config.App.Twitter.consumer_secret,
  access_token_key: config.App.Twitter.access_token_key,
  access_token_secret: config.App.Twitter.access_token_secret,
});


var utils = require('../utils/utils');

module.exports = function(req, res) {
  var handle = req.query.handle;
  var id  = req.query.id;

  // fetch all followers ids and store it variable
  // for each followers fetch their timeline
  // from each timeline post, get day they posted and record it
  // for each post, record the day_time range in which the has posted try to put like 2-3

  // deciding what to use as identifier for current user
  var params ={};
  if (handle) {
    params.screen_name = handle;
  }else {
    params.user_id = id;
  }

  var followers_count= 0;
  var days = {};
  var day_time = {};
  // returning to client immediately, and return result of computation later via websocket
  res.send({
    status: 200,
    message: "Processing your data.."
  });
  notify_web_client('Started Processing... ');
  async.waterfall([
    function(callback){
      // Step- 1: get the followers list
      get_followers(handle, function(followers_id){
        if(followers_id) {
            followers_count= followers_id.length;
            callback(null, followers_id);
        } else {
          callback(new Error("Error processing followers "))
        }
      });
    },
    function(ids, outer_callback){
      // Step-2: tweets of each follower and store into mongodb for later processing
      // get maximum tweet returned by user
      var count = 0 ;
      async.eachSeries(ids,function(id, callback){
        // process tweet for id'th follower
        client.get('statuses/user_timeline', {user_id:id, count:200, trim_user:1}, function(error,tweets, response){
          count++;
          notify_web_client('Processing Tweets for ' + count + '/'+ followers_count + ' follower...');
          //console.log(' Processing  ' + count);
          //console.log(' Error object ' + JSON.stringify(error));

          if(error){
            console.log('Error while fetching tweets ' + id + " ---- " + JSON.stringify(error));

            if(error.length !== 0 && error[0] !== undefined  && error[0].code === 88) {
              // rate limits hits
              //console.log('rate limiting hits wait for sometime  ');
              notify_web_client('Twitter Rate limit hit, please wait for sometime...');
              setTimeout(function(){
                //console.log('Awake from rate limiting ....');
                notify_web_client('Trying again after rate limit ');
                callback();
              }, config.App.Twitter.rate_limit_sleep_time);
            }else {
              console.log('another callback')
              callback();
            }

          }else{
            console.log(count + ' : Processing Tweets for ' + id + ', tweet count :' + tweets.length);

            // no error process
            //console.log('got tweets as ',  tweets instanceof Array)
            async.eachSeries(tweets, function(t, cb){
              // this will return, day in a week and time of day object as {day: <day>, time: <time>}
              var t = utils.date_to_days(t.created_at);
              // increase the count for day e.g Monday
              utils.incr(days, t.day);
              // for each day, we are storing time and its count
              // it will be stored as follows
              //
              // day_time = {
              //  'Mon' : { 0: 1, 1:33 ...}
              //  'Tue' : {4:5, 2:34 ...}
              // }
              // each object has {<time-in-24-hours-format> : <count>}

              // increase the hour
              if (!day_time[t.day]) {
                day_time[t.day] = {};
              }

              utils.incr(day_time[t.day], t.hour);

              cb();
            },function(e){
              if(e){
                console.log(e)
              }
              //console.log("Done processing tweets for " + id);
              callback()

            });
          }

        }); // getting each followers timeline completed
      },function(err){
        console.log('completed processing for all the followers');
        outer_callback(null);
      });
    }
  ], function(err, resp){
    // Now, inside day_time, we have each day analytics for timing like
    // day_time = {"Sunday" : {"0":23, 1: "23"..}, "Monday" : {"0":23, "1": 53..}}
    // for each of Day, lets get the best time of day
    var best_day_time= {};
    var day_time_keys= Object.keys(day_time);
    for (var t in day_time_keys) {
      var best_time = utils.get_top_most(day_time[day_time_keys[t]]);
      best_day_time[day_time_keys[t]]= utils.convert_am_pm(best_time);
    }

    // comment out these lines to see each of map contents
    // console.log("Best time day and time map " + JSON.stringify(best_day_time))
    // console.log('Days ' + JSON.stringify(days))

    io.sockets.emit('result', {
      handle: handle,
      day:  utils.get_top_most(days),
      day_time:  best_day_time
    });
  });
} // end of module.exports


function notify_web_client (message){
  io.sockets.emit('updates', {
    message: message
  });
}
//

function get_followers(handle, callback) {
  var params = {screen_name: handle};
  client.get('followers/ids', params, function(error,ids){
    if (error) {
      console.log(error);
      callback(null);

    } else {
      var followers= ids['ids'];
      notify_web_client('Your followers are  '+ followers.length);
      callback(followers);
    }
  });
}