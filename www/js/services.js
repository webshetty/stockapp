angular.module('stockapp.services', [])

.factory('encodeURIService', function() {
  return {
    encode: function(string){
      console.log(string);
      return encodeURIComponent(string).replace(/\"/g, "%22").replace(/\ /g, "%20").replace(/[!'()]/g, escape);
    }
  };
})

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

;
