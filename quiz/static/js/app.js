var utils = {
  score: function(vectorA, vectorB) {
    return vectorA.map(function(valueA, index){
      var valueB = vectorB[index];
      return valueA === valueB ? 1: 0;
    }).reduce(function(a,b){ return a+b; });
  },
  hash: function(vector){
    var code = {'0': 'A', '1': 'S', '-1': 'N'};
    return vector.map(function(voto){ return code[voto]; }).join('');
  },
  readhash: function(){
    var code = {'A': 0, 'S': 1, 'N': -1};
    return window.location.hash.split("/")[1].split('').map(function(char){
      return code[char];
    });
  }
};

// Let's define our first command. First the text we expect, and then the function it should call
var commands = {
  'sob a proteção de deus iniciamos nossos trabalhos' : function () {
    $("#bigredbtn").click();
  },
  'pela família meu voto É sim': function() {
    $('.btn-concordo:visible').click();
  },
  'pela família voto É sim': function() {
    $('.btn-concordo:visible').click();
  },
  'meu voto é sim': function() {
    $('.btn-concordo:visible').click();
  },
  'Meu voto é não': function() {
    $('.btn-discordo:visible').click();
  },
  'é golpe': function() {
    $('.btn-discordo:visible').click();
  }
};

$(document).ready(function(){
  annyang = null
  if (annyang) {
    // Add our commands to annyang
    annyang.setLanguage('pt-BR');
    annyang.addCommands(commands);
    annyang.debug(true);
    annyang.start();
    console.log('Annyang ready!');

  }
});

angular.module('quizapp', []);

angular.module('quizapp').factory('quiz', [
  function(){
    var quiz = {
      started: false,
      simbolica: false,
      propostas: propostas,
      parlamentares: parlamentares,
      automatic: 0,
      current: 0,
      vote: function(index, value){
        this.propostas[index].uservote = value;
        this.current++;
      }
    };
    return quiz;
  }
]);

angular.module('quizapp').
  controller('introCtrl', [
    '$scope', 'quiz',
    function($scope, quiz){
      $scope.quiz = quiz;
      $scope.start = function(){
        $scope.quiz.started = true;
        if (annyang) {
          annyang.start();
        } else {
          console.log('banana');
        }

        // $('html, body').animate({
        //   scrollTop: $('.quiz-ui').offset().top
        // }, 1000);
      };
    }
  ]);

angular.module('quizapp').
  controller('quizUICtrl', [
    '$scope', 'quiz',
    function($scope, quiz){
      $scope.quiz = quiz;
      $scope.iniciar_simbolica = function(){
        $scope.readout($scope.quiz.current);
      };
      $scope.readout = function(){
        var simbolica = 'Favoráveis permaneçam como estão, contrários se mániféstem.';
        if ($scope.quiz.simbolica) {
          responsiveVoice.speak(
            $scope.quiz.propostas[$scope.quiz.current].ementa,
            'Brazilian Portuguese Female',
            {onend: function(){
              responsiveVoice.speak(simbolica, 'Brazilian Portuguese Female',
                {onend: function() {$('.quiz-question .btn-concordo').eq($scope.quiz.current).click();},
                rate :1.5});
            }, rate: 1.2}
          );
        }
      };

      $scope.$watch('quiz.simbolica', function(){
        if ($scope.quiz.simbolica) {
          $scope.readout();
        } else {
          responsiveVoice.cancel();
        }
      });

      $scope.$watch('quiz.started', function(){
        if ($scope.quiz.started) {
          $scope.readout();
        }
      });
      $scope.$watch('quiz.current', function(){
        if (($scope.quiz.current > 0) && ($scope.quiz.current+1 < $scope.quiz.propostas.length)) {
          $scope.readout($scope.quiz.current);
        }
      });
    }
  ]);

angular.module('quizapp').
  controller('resultsCtrl', [
  '$scope', 'quiz',
    function($scope, quiz){
      $scope.quiz = quiz;
      
      $scope.calculateScores = function(){
        var uservotes = $scope.quiz.propostas.map(function(proposta){ return proposta.uservote; });
        $scope.hash = utils.hash(uservotes);
        location.hash = '!/'+$scope.hash; //Troca hash
        $('.fb-share-button').attr('data-href', location.href);
        $scope.quiz.parlamentares.forEach(function(parlamentar){
          parlamentar.score = utils.score(uservotes, parlamentar.votos);
        });
      };

      if (window.location.hash && window.location.hash.split('/')[1].length === propostas.length){
        $scope.quiz.automatic = 1;
        utils.readhash().forEach(function(voto, index){
          $scope.quiz.vote(index, voto);
        });
        $scope.calculateScores();
        $scope.sorted = _.sortBy($scope.quiz.parlamentares, 'score').reverse().slice(0, 30);
        window.document.title = 'Você vota mais parecido com '+$scope.sorted[0].nome; + ' (' + $scope.sorted[0].partido + ') - Quem Vota' //hackish para o titulo
        $scope.quiz.started = true;
      }
      

      $scope.$watch('quiz.current', function(){
        if (($scope.quiz.current === $scope.quiz.propostas.length) && $scope.quiz.automatic == 0){
          var uservotes = $scope.quiz.propostas.map(function(proposta){ return proposta.uservote; });
          $scope.hash = utils.hash(uservotes);
          window.location.href = '/#!/'+$scope.hash;
          window.location.reload();
        }
      });
    }
  ]);
