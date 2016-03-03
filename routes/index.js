var express = require('express');
var router = express.Router();
var Twitter = require('twitter');
var async= require('async');
var mongojs = require('mongojs')
var db = mongojs("ajduke:mypass121@ds019638.mlab.com:19638/ajduke-demos", ["followers","tweets"]);

var client = new Twitter({
  consumer_key: '3rVYrp0rAQYOaWigdUjwB2o0V',
  consumer_secret: 'btPZwEMPLpDvpssPlajLTJlhbiYrB5TWTt4p2XBmhBfP7QfQP0',
  access_token_key: '108542086-z4NXhnMBjCmYmJCwtolq6dy5YPm0G8JkOnFBHsj5',
  access_token_secret: 'zhcZ3jSj4afn4pV4vBmd3Fj9act4L0FuDkzxgcMNRajKa'
});

var days= ["Sun","Mon", "Tue", "Wed","Thu", "Fri", "Sat"];

var followers_ids= [];

router.get('/tweets', function(req, res, next) {
  //{user_id:"_ajduke", count:1, trim_user:1}
  client.get('statuses/user_timeline', {user_id:"103760901"}, function(error,tweets, response) {
    if(error){
      console.log(error);
      res.send({
        error: error
      })
      return;
    }

    res.send({
      tweets: tweets
    })
  })

});

router.get('/process', function(req, res, next) {
  var handle = req.query.handle;
  var id  = req.query.id;

  // starting for new user
  followers_ids= [];
  // clear mongodb database for same

  // fetch all followers ids and store it variable
  // for each followers fetch their timeline
  // from each timeline post, get day they posted and record it
  // for each post, record the time range in which the has posted try to put like 2-3

  // statuses/user_timeline
  // search/tweets
  var last_tweet_ts= "";
  var current_user_id = "";
  async.waterfall([
    function(callback){
      // Get Date and time of last tweet
      client.get('statuses/user_timeline', {user_id:id, count:1, trim_user:1}, function(error,tweets, response) {
        if (error) {
          console.log('Error while fetching tweets ' + id + " ---- " + JSON.stringify(error));
        }
        if (tweets.length > 0) {
          last_tweet_ts = tweets[0].created_at;
          current_user_id= tweets[0].user.id;
          console.log('------------- last tweet timestamp ' + last_tweet_ts);
          db.tweets.remove({"for_user_id": current_user_id}, function(){
            callback(null);
          });
        } else {
          callback(new Error("No user tweets found"));
        }
        res.send({
          status: 200,
          message: "We you processing your data"
        })
      });
    },
    function(callback){
      var params = {screen_name: handle};
      // get the followers list
      client.get('followers/ids', params, function(error,ids, response){
        if (error) {
          console.log(error);
          callback(new Error(error))
        } else {
          followers_ids = ids;
          db.followers.update({user_handle:handle},{$set:{user_handle: handle, followers: ids}},{upsert:true}, function(errp, resp){
            if(errp){
              console.log("error while inserting followers list " + errp)
            }
            console.log("inserted properly "+ ids.ids.length);
            callback(null, ids);
          });
        }
      });
    },
    function(ids, callback){
      // tweets of each follower and store into mongodb
      var count= 1;
      async.eachSeries(ids.ids,function(id, callback){
        client.get('statuses/user_timeline', {user_id:id, count:1000,trim_user:1}, function(error,tweets, response){
          if(error){
            console.log('Error while fetching tweets ' + id + " ---- " + error);
          }
          console.log(count+' : Got tweets for user '+ id +' as ' + tweets.length);
          count++;
          async.eachSeries(tweets, function(t, cb){
            var n_ts = new Date(t.created_at);
            //console.log(t.created_at);
            // his last tweet timestamp
            var u_ts = new Date(last_tweet_ts);
            // process only those tweets which are posted his last tweet
            // so to extract
            if(n_ts.getTime() >= u_ts.getTime()) {
              var t_obj = {
                created_at : t.created_at,
                for_user_id: current_user_id,
                user_id: id,
                tweet_id: t.id,
                hour: n_ts.getUTCHours(),
                day: days[n_ts.getUTCDay()]// 0-6
              };
              db.tweets.insert(t_obj ,function(e, r){
                if (e){
                  console.log("Error while inserting tweet ",e);
                } else {
                  //console.log("Tweet updated ", r)
                }
                cb();
              }); // tweet insertion comleted
            }else{
              // discard tweets
              cb(new Error('Tweets not in range'));
            }

          },function(e){
            if(e){
              console.log(e)
            }
            console.log("Done processing tweets for " + id);
            callback()

          });
        }); // getting each followers timeline completed
      },function(err){
        console.log('completed iterating for followers');
        // Now, we stored all tweets of his followers
        db.tweets.aggregate([{$group:{_id:"$hour", total:{$sum:1}}}, {$sort:{total:-1}}, {$limit:1}], function(err, hour){
          if(err) {
            console.log("Error while aggregating of hour ");
          }
          callback(null, hour);
        });
      });
    },
    function(hour,callback){
      // aggregate on hour and day fields
      db.tweets.aggregate([{$group:{_id:"$day", total:{$sum:1}}}, {$sort:{total:-1}}, {$limit:1}], function(errp, day){
        if(errp) {
          console.log("Error while aggregating of day");
        }
        var t = {hour: hour[0], day: day[0]};
        console.log(JSON.stringify(t));
        callback(null, t);
      });

    }
  ], function(err, resp){
      var message = 'You should post on ' +resp.day._id + " and between time " + resp.hour._id + " - " + (resp.hour._id+1);
      console.log(message);
  });
});

module.exports = router;
