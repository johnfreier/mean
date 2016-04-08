var Promise = require("bluebird");
var MongoClient = Promise.promisifyAll(require("mongodb")).MongoClient;

var main = function(database) {

  console.log('main');

  insertRecord(database);

};

var insertRecord = function(collection) {
  console.log('insertRecord');
  var doc1 = { 'doc' : 'First document' };
  collection.insert(doc1, {w:1}).then(function(result) {
    var obj = result.ops[0];
    console.log('id:' + obj._id);
  });
};

var db = MongoClient.connect('mongodb://localhost:27017/exampleDB').then(function(db) {

  var collection = db.collection('example');

  main(collection);
});
