// this we will use it while converting numeric to days
var days=  ["Sunday","Monday", "Tuesday", "Wednesday","Thursday", "Friday", "Saturday"];

exports.days = days;

exports.incr = function (obj, prop){
    if (!obj[prop]) {
      obj[prop] =  1;
    }else {
      obj[prop]++
    }
  return obj;
}

exports.date_to_days = function(date){
  var timestamp = new Date(date);
  var hour=  timestamp.getUTCHours();
  var day = days[timestamp.getUTCDay()]; // [0-6]
  return {
    hour: hour,
    day: day
   };
};

// this sorts based on object values and return top result
exports.get_top_most = function(data_object){

  if (!data_object || Object.keys(data_object).length == 0 ) {
    return null;
  }

  if (Object.keys(data_object).length == 1 ) {
    return Object.keys(data_object)[0];
  }

  // this is custom sorted function for JS objects
  var sortable = [];
  // first we convert object and store it in the array
  for (var obj in data_object){
    sortable.push([obj, data_object[obj]]);
  }

  // now we have as Array of Array
  // for e.g. {'Sunday' : 23, 'Monday': 24} it will be converted to -> [ ['Sunday', 23] , ['Momday', 24] ]

  // now, we use the sort function and provide the custom comparable function
  var sorted_array= sortable.sort(function(a, b) {
    return b[1] - a[1];
  });


  // finally, in sorted_array, we all elements sorted
  // now we need to get topmost
  var val = sorted_array[0][0];
  return val;
};

exports.convert_am_pm = function(time){
  if (time > 12)
    return (time-12) + "pm";
  else
    return time + "am";
}
