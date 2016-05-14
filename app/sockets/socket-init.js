
exports.init= function(server) {
  var io = require('socket.io')(server)
  io.on('connection', function(socket){
    //console.log('connected made')

    socket.on('join_notif', function(){
      socket.join('result');
      //console.log('joined notif ');
    });

    socket.on('join_updates', function(){
      socket.join('updates')
    })

  });
  GLOBAL.io= io;
}

