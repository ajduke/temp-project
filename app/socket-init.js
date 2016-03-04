
exports.init= function(server) {
  var io = require('socket.io')(server)
  io.on('connection', function(socket){
    console.log('connected made')

    socket.on('join_notif', function(){
      socket.join("notif")
      console.log('joined notif ')
    });

    socket.on('disconnect', function(data) {

      //# do we really need this ??
      console.log('user disconnected...' + socket.id)
    });

  });
  GLOBAL.io= io;
}

