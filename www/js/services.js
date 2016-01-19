angular.module('stockapp.services', [])

.constant('FIREBASE_URL', 'https://mystockmarketapp.firebaseio.com/')

.factory('encodeURIService', function() {
  return {
    encode: function(string){
      console.log(string);
      return encodeURIComponent(string).replace(/\"/g, "%22").replace(/\ /g, "%20").replace(/[!'()]/g, escape);
    }
  };
})

//Modal Service
.factory('modalService' , function($ionicModal) {

  this.openModal = function(id){
    var _this = this;
    if(id == 1){
      $ionicModal.fromTemplateUrl('templates/search.html', {
        scope: null,
        controller: 'SearchCtrl'
      }).then(function(modal) {
        _this.modal = modal;
        _this.modal.show();
      });
    }
    else if(id == 2){
      $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: null,
        controller: 'LoginCtrl'
      }).then(function(modal) {
        _this.modal = modal;
        _this.modal.show();
      });
    }
    else if(id == 3){
      $ionicModal.fromTemplateUrl('templates/signup.html', {
        scope: null,
        controller: 'LoginCtrl'
      }).then(function(modal) {
        _this.modal = modal;
        _this.modal.show();
      });
    }
  };

  this.closeModal = function() {
    var _this = this;
    if(!_this.modal) return;
    _this.modal.hide();
    _this.modal.remove();
  };

  return {
    openModal: this.openModal,
    closeModal: this.closeModal
  };
})


//Firebase Integration
.factory('firebaseRef' , function($firebaseObject, FIREBASE_URL ) {
  var firebaseRef = new Firebase(FIREBASE_URL);
  return firebaseRef;
})

//user Service
.factory('userService' , function($rootScope, firebaseRef, modalService) {

  var login = function(user) {
    firebaseRef.authWithPassword({
      email: user.email,
      password:user.password
    }, function(error, authData){
      if(error){
        console.log("Invalid user ", error);
      }else{
        $rootScope.currentUser = user;
        modalService.closeModal();
        console.log("Login successfull ", authData);
      }
    });
   };

  var logout = function() {
    firebaseRef.unauth();
    $rootScope.currentUser = '';
  };

  var signup = function(user){
    console.log("email ", user.email);
    console.log("password ", user.password);
     firebaseRef.createUser({
       email: user.email,
       password: user.password
     }, function(error, userData) {
       if(error){
         console.log("error creating user ", error);
       }else{
         login(user);
         console.log("User created successfully with uid " , userData.uid);
       }
     });
  };

  var getUser = function(){
    return firebaseRef.getAuth();//gets user deatails;
  };

  if(getUser()){
    $rootScope.currentUser= getUser();
  }

  return {
    login: login,
    logout: logout,
    signup: signup
  };

})

//Date Service
.factory('dateService', function($filter) {
  var currentdate = function(){
      var d = new Date();
      var date = $filter('date')(d, 'yyyy-MM-dd');
      return date;
  };

  var aYearAgoDate =  function(){
      var d = new Date(new Date().setDate(new Date().getDate() - 365));
      var date = $filter('date')(d, 'yyyy-MM-dd');
      return date;
  };

  return {
    currentdate: currentdate,
    aYearAgoDate: aYearAgoDate
  };
})

//Stock Data Related Service
.factory('stockDataService', function($q, $http, encodeURIService){
  var getPriceData = function(ticker){
    var deferred = $q.defer(),
    url="http://finance.yahoo.com/webservice/v1/symbols/"+ ticker +"/quote?format=json&view=detail";
    $http.get(url)
      .success(function(json){
        var jsonData = json.list.resources[0].resource.fields;
        deferred.resolve(jsonData);
      })
      .error(function(error){
        console.log('error getting price :' + eror);
        deferred.reject();
      });
    return deferred.promise;
  };


  var getStockDetails = function(ticker) {
     //"http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20IN%20(%22"+ ticker + "%22)&format=json&env=http://datatables.org/alltables.env";
    var deferred = $q.defer(),
    query = 'select * from yahoo.finance.quotes where symbol IN ( "'+ ticker + '")';
    url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIService.encode(query) + '&format=json&env=http://datatables.org/alltables.env';
    console.log(url);
    $http.get(url)
    .success(function(json){
      var jsonData =  json.query.results.quote;
      deferred.resolve(jsonData);
    })
    .error(function(error) {
      console.log("Error getting stock details :" + error);
      deferred.reject();
    });
    return deferred.promise;
  };

  return {
    getPriceData: getPriceData,
    getStockDetails: getStockDetails
  };

})

.factory('searchSearvice', ['$q', '$http' ,
  function($q, $http ) {

    return {
      search: function(query){
        console.log(query);
        var deferred = $q.defer(),
            url = 'https://s.yimg.com/aq/autoc?query='+ query + '&region=CA&lang=en-CA&callback=YAHOO.util.ScriptNodeDataSource.callbacks';

        YAHOO =  window.YAHOO = {
          util:{
            ScriptNodeDataSource: {}
          }
        };

        YAHOO.util.ScriptNodeDataSource.callbacks = function(data){
          var jasonData = data.ResultSet.Result;
          deferred.resolve(jasonData);
        };
        $http.jsonp(url)
          .then(YAHOO.util.ScriptNodeDataSource.callbacks);

        return deferred.promise;

      }
    };

}])

// Notes Service
.factory('notesService', function(notesCacheService) {

      var getNotes = function(ticker){
        return notesCacheService.get(ticker);
      };

      var addNote = function(ticker, note){
        var stockNotes = [];
        if(notesCacheService.get(ticker)){
          stockNotes = notesCacheService.get(ticker);
          stockNotes.push(note);
        }else{
          stockNotes.push(note);
        }
        notesCacheService.put(ticker, stockNotes);
      };

      var deleteNote = function(index, ticker){
        console.log(ticker);
        console.log(index);
        var stockNotes = [];
        stockNotes = notesCacheService.get(ticker);
        console.log(stockNotes);
        stockNotes.splice(index,1);
        notesCacheService.put(ticker, stockNotes);
      };

  return {
    getNotes: getNotes,
    addNote: addNote,
    deleteNote: deleteNote
  };

})

// Notes Cache
    .factory('notesCacheService', function(CacheFactory) {
      var notesCache;

      if(!CacheFactory.get('notesCache')){
        notesCache = CacheFactory('notesCache', {
          storageMode: 'localStorage'
        });
      }else {
        notesCache = Factory.get('notesCache');
      }
      return notesCache;
  })



;
