var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var Q = require("q");

var main = function(collection) {
  //insertRecord(collection);
  findRecord(collection, '5707285ee1a58bfc0462b250');
}

var insertRecord = function(collection) {
  var doc1 = { 'doc' : 'First document' };
  collection.insert(doc1, {w:1}, function(error, result) {
    var obj = result.ops[0];
    console.log('id:' + obj._id);
  });
};

var findRecord = function(collection, id) {
  collection.findOne({ '_id': ObjectId(id) }, function(error, item) {
    console.log(JSON.stringify(item));
  });
}

MongoClient.connect('mongodb://localhost:27017/exampleDB', function(error, db) {

  if (error) {
    console.log('Database not found!');
    process.exit(1);
  }

  var collection = db.collection('example');

  main(collection);

});
