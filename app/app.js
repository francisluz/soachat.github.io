var app = angular.module("ChatApp", ["ngMaterial", "ngRoute", "firebase", "lk-google-picker"])
.config(['lkGoogleSettingsProvider', function(lkGoogleSettingsProvider) {

  lkGoogleSettingsProvider.configure({
    apiKey   : 'AIzaSyAnYxzizdvb6TMiIpDgBW_FAXXLeSgDnzU',
    clientId : '752915435201-8ufbg59v14uc69fv6egfn23accvdrk92.apps.googleusercontent.com',
    scopes 	 : ['https://www.googleapis.com/auth/plus.login'],
    locale   : 'pt-br'
   })
 }]);

app.directive('ngEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                    scope.$apply(function(){
                        scope.$eval(attrs.ngEnter, {'event': event});
                    });

                    event.preventDefault();
                }
            });
        };
    });	

//Router
app.config(function($routeProvider,$locationProvider) {

  $routeProvider.
  when("/", {
    templateUrl: "views/login.html"
	}).
  when("/users", {
    templateUrl: "views/users.html",
    controller: "UsersCtrl",
        resolve: {
      // controller will not be loaded until $getCurrentUser resolves
      // simpleLogin refers to our $firebaseSimpleLogin wrapper in the example above
      "currentUser": ["simpleLogin", function(simpleLogin) {
        // $getCurrentUser returns a promise so the resolve waits for it to complete
        return simpleLogin.$getCurrentUser();
      }]
    }
  }).
  when("/chat/:id", {
    templateUrl: "views/chat.html",
    controller: "ChatCtrl"
  }).
  	otherwise({
        redirectTo: '/'
      });
});

app.factory("fbURL",["$firebase",function($firebase) {
  var ref = new Firebase("https://fiery-fire-1483.firebaseio.com");
  return ref;
}]);

app.factory("simpleLogin", ["$firebaseSimpleLogin", "fbURL", function($firebaseSimpleLogin, fbURL) {
  return $firebaseSimpleLogin(fbURL);
}]);

app.controller("LoginCtrl", function($scope, $rootScope, $location, $firebase, simpleLogin, fbURL) {
	
  var authRef = fbURL.child('users');
  var authClient = new FirebaseSimpleLogin(authRef, function(error, user) {
	  if (error) {
	    // an error occurred while attempting login
	    console.log(error);
	  } else if (user) {
	  	// save new user's profile into Firebase so we can
      	authRef.child(user.uid).set({user: user});
	    // user authenticated with Firebase
	    console.log("User ID: " + user.uid + ", Provider: " + user.provider);
	    $location.path('/users');
    	$location.replace();
	  } else {
	    // user is logged out
	  }
   });

  /*var isNewUser = true;
  var authClient = new FirebaseSimpleLogin(ref, function(error, user) {
    if (error) {
      console.log(error);
    } else if (user) {
      if( isNewUser ) {
      // save new user's profile into Firebase so we can
      ref.child('users').child(user.uid).set({
        user: user});
    }
      $location.path('/users');
      $location.replace();
    }
  });*/

  $scope.clickLogin = function() {
    $rootScope.auth = simpleLogin;
    $rootScope.auth.$login('google',{preferRedirect:true});
  }
});


app.controller("UsersCtrl", function($scope, $rootScope, $routeParams, $firebase, $location, $filter, fbURL, currentUser, simpleLogin) {
  
  var authRef = fbURL.child('users');
  //authRef.auth(currentUser.firebaseAuthToken);
  var sync = $firebase(authRef);

  $scope.auth = new FirebaseSimpleLogin(authRef, function(error, user) {
    if (error) {
      console.log(error);
    } else if (user) {
      $scope.auth = user;
      console.log(user);
    } else{
      $location.path('/');
      $location.replace();
    }
  });

  //$scope.auth = currentUser;
  console.log(currentUser);

  var usersResult = sync.$asArray();
  console.log(usersResult);

  //var usersResult2 = $filter('filter')(usersResult, { $id: currentUser.uid }, function (obj, test) { 
  //                                      return obj === test; });
  //console.log(usersResult2);

  //var usersResult3 = usersResult.filter(function(item) {
  //  return item.id == currentUser.uid;
  //});
  
  //console.log(usersResult3);

  $scope.users = usersResult;
  console.log($scope.users);

  $scope.startChat = function(to) {
  	
  	//var chatRef= fbURL.child('chats')
  	//.startAt($scope.auth.email)
    //.endAt(to.email)
    //.once('value', function(snap) {
    //   console.log('accounts matching email address', snap.val())
    //});
    

  	$location.path('/chat/'+to.id);
    $location.replace();
  }

  $scope.userFilter = function (item) { 
    return item.$id != $scope.auth.uid; 
  };

  $scope.clickLogout = function() {
    simpleLogin.$logout();
  }
});


app.controller("ChatCtrl", function($scope, $rootScope, $routeParams, $firebase, $firebaseSimpleLogin, $location, $anchorScroll, fbURL) {

  $scope.files = [];
  var authRef = fbURL;

  $scope.auth = new FirebaseSimpleLogin(authRef, function(error, user) {
    if (error) {
      console.log(error);
    } else if (user) {
      $scope.auth = user;
      console.log(user);
    } else{
      $location.path('/');
      $location.replace();
    }
  });

  $scope.paramId = $routeParams.id;

	var toRef = fbURL.child('users')
  	.startAt($routeParams.id)
    .endAt($routeParams.id)
    .once('value', function(snap) {
       $scope.userTo = snap.val();
    });


  var msgRef = new Firebase("https://fiery-fire-1483.firebaseio.com/messages")
  	.startAt($scope.auth.id)
    .endAt($routeParams.id)
    .once('value', function(snap) {
       console.log('messages matching', snap.val())
    });

  console.log(msgRef);

  var talkRef;

  if(msgRef){
  	talkRef = new Firebase("https://fiery-fire-1483.firebaseio.com/messages").child(msgRef.name());
  }
  else{
	talkRef = new Firebase("https://fiery-fire-1483.firebaseio.com/messages");
  }

  var sync = $firebase(talkRef);

  /*var chatRef= fbURL.child('chats')
  	.startAt($scope.auth.email)
    .endAt($scope.auth.email)
    .once('value', function(snap) {
       console.log('accounts matching email address', snap.val())
    });

    console.log(chatRef.)
    */

  //console.write($scope.auth);

  //ref.child($scope.auth.user);

  $scope.messages = sync.$asArray();

  $scope.clickUsers = function() {
  	$location.path('/users');
    $location.replace();
  }

  $scope.addMessage = function(text) {
    $scope.messages.$add({text: text, userTo: $scope.userTo, userFrom: $scope.auth});
    $scope.newMessageText = "";
  }

  $scope.clickLogout = function() {
    $scope.auth = $firebaseSimpleLogin(authRef);
    $scope.auth.$logout();
  }
});