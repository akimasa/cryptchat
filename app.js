
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , io = require('socket.io');

var app = express();

var server = http.createServer(app);

var sock = io.listen(server);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/room/*', routes.room);
app.get('/users', user.list);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
sock.on('connection', function(client) {
	client.emit("connected");
	client.on("init",function(req) {
		console.log(req);
		client.set('room',req.room);
		client.join(req.room);
	});
	client.on("mes",function(mes){
		client.get("room",function(err,room){
			if(!room){
				console.log("!room");
				return;
			}
			console.log("room:"+room);
			console.log("mes:"+mes);
			sock.sockets.to(room).emit("mes",mes);
		});
	});
});
