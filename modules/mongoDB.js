 /* jshint browser: true, jquery: true, camelcase: true, indent: 2, undef: true, quotmark: single, maxlen: 80, trailing: true, curly: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, nonew: true, unused: true, strict: true */

 /**************** ************** **************  **************
         Create  a movie schema
 ************** ************** **************  ************** */
 var Promise = require("bluebird");
 var mongoose = Promise.promisifyAll(require("mongoose"));

 mongoose.connect('mongodb://localhost/gameDB');

 // Create a movie schema
 var questionSchema = mongoose.Schema({
     question: String,
     answer: String
 });

 // Create a database collection model
 var Question = mongoose.model('Question', questionSchema);

 module.exports.Question = Question;