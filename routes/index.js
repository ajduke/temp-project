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

  var params = {
     screen_name: handle,
    // q:"from:twitterapi since:2011-06-20 until:2011-06-20"
    //q:"_ajduke",
    // count: 2,
    // exclude_replies: true,
    // trim_user: true,
    // since: "2015-01-05",
    //until: "2016-02-20"
    // max_id:"703520067649142800"
  };
  // fetch all followers ids and store it variable
  // for each followers fetch their timeline
  // from each timeline post, get day they posted and record it
  // for each post, record the time range in which the has posted try to put like 2-3

  //statuses/user_timeline
  // search/tweets
  var last_tweet_ts= "";
  var current_user_id = "";
  async.waterfall([
    function(callback){
      client.get('statuses/user_timeline', {user_id:id, count:1, trim_user:1}, function(error,tweets, response) {
        if (error) {
          console.log('Error while fetching tweets ' + id + " ---- " + JSON.stringify(error));
        }
        if (tweets.length > 0) {
          last_tweet_ts = tweets[0].created_at;
          console.log('------------- last tweet timestamp ' + last_tweet_ts);
          current_user_id= tweets[0].user.id;
          callback(null);
        } else {
          callback(new Error("No user tweets found"));
        }
      })
    },
    function(callback){
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
            console.log("inserted properly "+ ids.length);
            callback(null, ids);
          });
        }
      });
    },
    function(ids, callback){
      async.eachSeries(ids.ids,function(id, callback){
        client.get('statuses/user_timeline', {user_id:id, count:1000,trim_user:1}, function(error,tweets, response){
          if(error){
            console.log('Error while fetching tweets ' + id + " ---- " + error);
          }

          console.log('Got tweets for user '+ id +' as ' + tweets.length);
          async.eachSeries(tweets, function(t, cb){
            var n_ts = new Date(t.created_at);
            console.log(t.created_at)
            var u_ts = new Date(last_tweet_ts);
            if(n_ts.getTime() >= u_ts.getTime()) {
              var t_obj = {
                created_at : t.created_at,
                for_user_id: current_user_id,
                user_id: id,
                tweet_id: t.id,
                h: n_ts.getUTCHours(),
                d: days[n_ts.getUTCDay()]// 0-6
              };

              db.tweets.insert(t_obj ,function(e, r){
                if (e){
                  console.log("Error while inserting tweet ",e);

                } else {
                  console.log("Tweet updated ", r)
                }
                cb()
              });
            }else{
              // discard tweets
              console.log('Tweets not in range ');
              cb(new Error('Tweets not in range'));
            }

          },function(e){
            if(e)
              console.log(e)
            console.log("Done processing tweets for " + id);
            callback()

          });

          //console.log('got tweet for ' + id + "\n" + JSON.stringify(tweets));

        })
      },function(err){
        console.log('completed iterating for followers')
        callback(null, ids);
      });

    },
    function(ids,callback){
      callback(null, ids);
    }
  ], function(err, resp){
    // final callback after processing,
    // return data to client with
    res.send({
      handle: handle,
      tweets: resp
    })
  })

});

module.exports = router;
