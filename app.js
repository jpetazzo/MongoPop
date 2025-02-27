console.log('app.js has just been invoked\n')

/**
 * Module dependencies.
 */

var express = require('express');
console.log('express has been loaded.');

var app = module.exports = express.createServer();
console.log('an express server has been created');

var mongoose = require('mongoose');
console.log('mongoose has been loaded');


var dotcloudMongoDB = false;
var fs = require('fs')

try {
  var environment = JSON.parse(fs.readFileSync('../environment.json', 'utf-8'));
  
  if (environment.DOTCLOUD_MONGO_MONGODB_URL) {
    dotcloudMongoDB = environment.DOTCLOUD_MONGO_MONGODB_URL + '/admin'
  }
  
} catch(err) {
  console.log('Could not read environment file');
}

if (!dotcloudMongoDB && process.env.DOTCLOUD_MONGO_MONGODB_URL) {
  dotcloudMongoDB = process.env.DOTCLOUD_MONGO_MONGODB_URL + '/admin'
}

var connectionString = process.env.MONGOLAB_URI || process.env.MONGO_URI || 
  dotcloudMongoDB ||
  'mongodb://' + process.env.MONGOPOP_MONGO_USER + ':' + 
  process.env.MONGOPOP_MONGO_PW + '@' + process.env.MONGOPOP_MONGO_URL ;

console.log('About to use the following connection string: ' + connectionString);
var db = mongoose.connect(connectionString);

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var StackSchema = new Schema({
  name: String
  ,items: [StackItemSchema]
});

var StackItemSchema = new Schema({
  blob: Number
});

var Stack = mongoose.model('Stack', StackSchema);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});


function displayStack(stack, status, res, req) {
  var currentPath = req.route.path;
  
  console.log('About to render for '+ currentPath);

  var links = {
    "/" : 'View the List',
    "/push" : "Push",
    "/pop" : "Pop"
  };
  
  res.render('index', {
    title: 'MongoPop',
    links: links,
    statusline: status,
    items: stack.items,
    currentPath: currentPath
  });
  console.log('Rendering is DONE.');
}

function popTopItem (stack,callback) {
  var theBlob = stack.items[stack.items.length-1].blob;
  
  stack.items = stack.items.splice(stack.items.length-1, stack.items.length);
  
  stack.save( function (err, stack) {
    if (err) throw err;
    callback(theBlob);
  });
}

function addRandomItem(stack, callback) {
  var randomNumber = Math.random();
  stack.items.push({ blob: randomNumber });
  stack.save(function(err, stack){
    if (err) throw err;
    callback(randomNumber);
  });
}
// Routes

app.get('/', function(req, res){
  console.log('Request to index received');
  Stack.findOne({name:'The Stack'}, function (err, stack) {
    if (err) throw err;
    
    if (!stack) {
      return Stack.create({name: 'The Stack'}, function (err, stack) {
        if (err) throw err;
        displayStack(stack, 'Created new "The Stack"', res, req);
      });
    }
    
    return displayStack(stack, 'Used existing "The Stack"', res, req);
  });

});

app.get('/push', function(req, res){
  Stack.findOne({name:'The Stack'}, function (err, stack) {
    if (err) throw err;
    
    if (stack) {
      return addRandomItem(stack, function(num){
        displayStack(stack, 'Pushed '+ num +' onto The Stack', res, req);
      });
    }
  });
});

app.get('/pop', function(req, res){
  Stack.findOne({name:'The Stack'}, function (err, stack) {
    if (err) throw err;
    
    if (stack && stack.items.length) {
      return popTopItem(stack, function(num) {
        displayStack(stack, 'Popped ' + num + ' off The Stack', res, req);
      });
    } else {
      return displayStack(stack, 'Empty Stack!', res, req);
    }
  });
});

var port = process.env.PORT || 8080;

app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
