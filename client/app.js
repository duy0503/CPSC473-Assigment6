/* jshint browser: true, jquery: true, camelcase: true, indent: 2, undef: true, quotmark: single, maxlen: 80, trailing: true, curly: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, nonew: true, unused: true, strict: true */
'use strict';
var currentId;
var results = [];
var socket;

//View Model
function AppViewModel() {

    //Current question
    this.question = ko.observable("Here is the question");

    //List of answers from all users
    this.answers = ko.observableArray();

    //Display new answer coming from a user
    this.addAnswer = function(n, r) {
        this.answers.push({ name: n, result: r });
    };

    //Remove all answers from users 
    this.removeAnswers = function() {
        this.answers.removeAll();
    };

    //Total scores
    this.scores = ko.observableArray();

    //Function to display total scores
    this.showScores = function(correct, incorrect) {
        this.scores.removeAll();
        this.scores.push({ correctAnswers: correct, incorrectAnswers: incorrect });
    };

    //List of online users
    this.users = ko.observableArray();

    //Function to update users
    this.updateUsers = function(users) {
        this.users.removeAll();
        for (var i = 0; i < users.length; i++) {
            this.users.push({ name: users[i] })
        }
    };

    //User's answer for the current question
    this.myAnswer = ko.observable('');

    //CLick event to send the answer to server
    this.sendAnswer = function(event) {
        var answer = this.myAnswer();
        var req = {
            'answerId': currentId,
            'answer': answer,
        };

        $.post('answer', req, function(res) {
            socket.emit('new answer', res.Correct);
        });

        this.myAnswer('');
    }
}


var main = function() {

    socket = io.connect();

    var myAppViewModel = new AppViewModel();
    ko.applyBindings(myAppViewModel);

    $('#userNameBtn').on('click', function(event) {
        socket.emit('new user', $('#userName').val(), function(data) {
            if (data) {
                $('#userArea').hide();
                $('#quizArea').show();
            }
        });
        $('#userName').val('');
    });


    socket.on('get new question', function(data) {
        $.get('question', function(res) {
            myAppViewModel.question(res.Result);
            currentId = res.id;
        });
    });

    socket.on('get users', function(data) {
        myAppViewModel.updateUsers(data);
    });

    socket.on('new answer', function(data) {
        var result = '';
        if (data.result === true) {
            result = ' answered correctly';
        } else {
            result = ' answered incorrectly';
        }
        myAppViewModel.addAnswer(data.name, result);
    });

    socket.on('scores', function(data) {
        $.get('score', function(res) {
            myAppViewModel.showScores(res.Correct, res.Incorrect);
        });
    });

    socket.on('new round', function(data) {
        myAppViewModel.removeAnswers();
    });

};

$(document).ready(main);