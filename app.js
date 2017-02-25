const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const http = require("http");
const WebSocket = require('ws');

const boardrouter = require('./routes/BoardRouter');
const wsa = require('./app/WebSocketAdapter');
const es = require('./app/EventStore');


// ---------------------------------------------------------------- context

const app = express();
const eventStore = new es.EventStore()


// ------------------------------------------------------ view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', new boardrouter.BoardRouter(eventStore).router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// ---------------------------------------------------------- error handler

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



const server = http.createServer(app)
const wss = new WebSocket.Server({
    server: server,
});
console.log("websocket server: ", wss);
new wsa.WebSocketAdapter(wss, eventStore);

server.listen(8081, '192.168.178.25', function listening() {
    console.log('Listening on %d', server.address().port);
});

module.exports = app;

