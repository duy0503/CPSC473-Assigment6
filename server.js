 /* jshint browser: true, jquery: true, camelcase: true, indent: 2, undef: true, quotmark: single, maxlen: 80, trailing: true, curly: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, nonew: true, unused: true, strict: true */
 'use strict';

 var express = require('express'),
     parser = require('body-parser'),
     gameDB = require('./modules/mongoDB'),
     redis = require('./modules/redis'),
     app;

 //create our Express powered HTTP server
 app = express();

 var server = require('http').Server(app);
 var io = require('socket.io')(server);
 var currentQuestion = null;
 var connections = [];
 var users = [];

 redis.set('correct', '0', function(err, reply) {
     console.log("Reset correct");
 });

 redis.set('incorrect', '0', function(err, reply) {
     console.log("Reset incorrect");
 });

 app.use(express.static(__dirname + '/client'));
 app.use(parser.json());
 app.use(parser.urlencoded({ extended: true }));


 gameDB.Question.remove({}, function(err, questions) {
     if (questions) {
         console.log('collection removed');
     }
 });

 //Create some questions
 var question1 = new gameDB.Question({
     question: 'Who was the first computer programmer?',
     answer: 'Ada Lovelace'
 });
 question1.save();

 var question2 = new gameDB.Question({
     question: 'Who led software development for NASA Apollo missions?',
     answer: 'Margaret Hamilton'
 });
 question2.save();

 var question3 = new gameDB.Question({
     question: 'What is your name?',
     answer: 'Duy'
 });
 question3.save();


 var getRandomInt = function(min, max) {
     min = Math.ceil(min);
     max = Math.floor(max);
     return Math.floor(Math.random() * (max - min)) + min;
 };

 app.post('/question', function(req, res) {
     var q = req.body.question;
     var a = req.body.answer;
     // store the question to the database
     var newQuestion = new gameDB.Question({
         question: q,
         answer: a
     });
     // Store the movie to the mongodb and redis
     newQuestion.save();

     console.log(q);
     res.json({ 'Result': 'success' });
 });

 app.post('/answer', function(req, res) {
     var id = req.body.answerId;
     var a = req.body.answer;

     var isCorrect = false;

     gameDB.Question.findOne({ _id: id }, function(err, result) {
         if (result) {
             if (result.answer === a) {
                 isCorrect = true;
             }

             if (isCorrect === true) {
                 redis.incr('correct', function(err, reply) {
                     console.log("Increment correct");
                 });
             } else {
                 redis.incr('incorrect', function(err, reply) {
                     console.log("Increment incorrect");
                 });
             }

             res.json({ 'Correct': isCorrect });

         }
     });

 });

 app.get('/score', function(req, res) {

     // get correct and incorrect answers
     var correct = 0;
     var incorrect = 0;

     redis.get('correct', function(err, reply) {
         correct = reply;
         redis.get('incorrect', function(err, reply) {
             incorrect = reply;
             res.json({
                 'Correct': correct,
                 'Incorrect': incorrect
             });
         });
     });
 });


 app.get('/question', function(req, res) {
     if (currentQuestion !== null) {
         res.json({
             'Result': currentQuestion.question,
             'id': currentQuestion._id.toString()
         });
     } else {
         res.json({
             'Result': 'no question',
             'id': '0'
         });
     }
 });

 var getNewQuestion = function() {
     gameDB.Question.find({}).exec(function(err, questions) {
         if (err) {
             console.log('Error');
         } else {
             if (questions.length > 0) {
                 var index = getRandomInt(0, questions.length);
                 currentQuestion = questions[index];
                 io.sockets.emit('get new question', null);
             } else {
                 console.log('Empty');
             }
         }
     });
 };

 var startNewRound = function() {
     io.sockets.emit('new round', null);
     getNewQuestion();
 };

 var updateUsernames = function() {
     io.sockets.emit('get users', users);
 };

 setInterval(function() {
     console.log('30 seconds passed. Start New Round');
     startNewRound();
 }, 30000);

 io.on('connection', function(socket) {
     socket.emit('news', { hello: 'world' });
     connections.push(socket);
     getNewQuestion();
     //Disconnet
     socket.on('disconnect', function() {
         console.log('user disconnect');
         users.splice(users.indexOf(socket.username), 1);
         connections.splice(connections.indexOf(socket), 1);
         updateUsernames();
     });

     // New user
     socket.on('new user', function(data, callback) {
         callback(true);
         console.log(data);
         socket.username = data;
         users.push(socket.username);
         updateUsernames();

     });

     socket.on('new answer', function(data) {
         console.log(data);
         io.sockets.emit('new answer', { name: socket.username, result: data });
         io.sockets.emit('scores', null);
     });


 });

 server.listen(3000);
 console.log('Server is listening on port 3000');