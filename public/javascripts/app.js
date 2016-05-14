var app =  angular.module('crowdfire', ['btford.socket-io']);

app.run(function ($rootScope) {
  $rootScope.results= null;
  $rootScope.processing= null;
  $rootScope.error = false;
  $rootScope.updates = null;
})
//socketConnect
app.controller('MainController', [
  "$scope", "socketConnect","$rootScope", "$http", function($scope,socketConnect, $rootScope, $http) {
    $scope.process= function(){
      var handle = $scope.user_handle;
      var id = $scope.user_id;
      $rootScope.results= null;
      $rootScope.error = false;
      console.log(handle + " : " +  id);
      if (handle && handle.length !== 0) {
        // process with handle
        // start loader for div
        $rootScope.processing= true;
        $http.get('/t/process?handle='+handle).success(function (res) {
          console.log('got the response')
          socketConnect.emit('join_notif');
        }).error(function(data){
          console.log("Error whule processing request ", data)
        });
      } else if (id && id.length !== 0){
        // process with id
        console.log('entered id ', id);
        $rootScope.processing= true;
        $http.get('/t/process?id='+id).success(function (res) {
          console.log('got the response')
          socketConnect.emit('join_notif');
        }).error(function(data){
          console.log("Error whule processing request ", data)
        });
      } else {
        // nothing is entered
        $rootScope.error = true;
        console.log('nothing is entrered');
      }
    };

    socketConnect.forward('result', $scope);
    $scope.$on('socket:result', function (ev, data) {
      console.log('got the results ', data);
      $rootScope.results =data;
    });

    socketConnect.forward('updates', $scope);
    $scope.$on('socket:updates', function (ev, data) {
      console.log('got the results ', data);
      $rootScope.updates =data;
    });

  }
]);

app.factory('socketConnect', function(socketFactory, $rootScope) {
  var socketConnect;
  socketConnect = socketFactory();
  socketConnect.forward('error');
  $rootScope.socketConnect = socketConnect;
  console.log('initialized socket.io ')
  return socketConnect;
});