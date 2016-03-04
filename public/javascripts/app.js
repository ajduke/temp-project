var app =  angular.module('crowdfire', ['btford.socket-io']);

app.run(function ($rootScope) {
  $rootScope.results= null;
  $rootScope.processing= null;
})
//socketConnect
app.controller('MainController', [
  "$scope", "socketConnect","$rootScope", "$http", function($scope,socketConnect, $rootScope, $http) {
    console.log('inside of controller ');
    $scope.process= function(){
      var handle = $scope.user_handle;
      var id = $scope.user_id;
      $rootScope.results= null;
      console.log(handle + " : " +  id);
      if (handle && handle.length !== 0) {
        // process with handle
        console.log('entered handled ', handle);
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
        console.log('nothing is entrered');
      }
    };

    socketConnect.forward('notif', $scope);
    $scope.$on('socket:notif', function (ev, data) {
      console.log('got the notification ', data)
      $rootScope.results =data;
    });
    console.log('completed controller ')

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