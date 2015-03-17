/* SmartCollection
 * (c) 2015 by StackEngine under the MIT license
 */

angular.module('SmartCollection', [])
.factory('SmartCollection', function($http){
  return function(config) {

    var loaded = false;
    var routes = config.routes || {};
    var key = config.key || 'id';
    var items = [];
    var itemIndex = {};
    var pendingItems = {};
    var promises = {};
    var model = config.model || (function GenericModel(attrs) {
      var self = this;
      angular.forEach(attrs, function(value, key) {
        self[key] = value;
      });
    });


    // PRIVATE INTERFACE ------------------------------------------------

    var performRequest = function(routeName, item) {
      var collection = this;
      var route = routes[routeName];

      // Do some sanity checking to make sure required values exist.
      if (!route) throw "Unknown route named '"+routeName+"'";
      angular.forEach(['url', 'method'], function(key) {
        if (!route[key]) {
          throw "Route '"+routeName+"' does not have required parameter: "+key;
        }
      });

      // Convert plain a plain key item to an object so we support both query types
      if (typeof item !== 'object') {
        var obj = {};
        obj[key] = item;
        item = obj;
      }

      // Compose the URL we will be using.
      var url = composeUrl(item, route.url, route.urlKeys);

      // If a request is already in process for this route, lets just
      // piggyback.  Instead of issuing another request, just return the
      // previous promise.
      var promiseKey = route.method+' '+url;
      if (promises[promiseKey]) {
        return promises[promiseKey];
      }

      // Transform the parameters if necessary.
      var params = angular.copy(item);
      if (route.transformRequestData) {
        params = route.transformRequestData(item);
      }

      var promise = $http[route.method](url, params).then(function(response) {
        // clean up after ourselves -- since this request is complete, remove
        // our cached promise reference so future requests to this route will
        // generate a new request.
        delete promises[promiseKey];

        var data = response.data;
        if (route.responsePrefix) {
          data = data[route.responsePrefix];
        }
        if (route.transformResponseData) {
          data = route.transformResponseData(response.data, item)
        }

        // GET requests will set loaded to true.  This is just a convenience
        // way to know if items have been retrieved.
        if (route.method.toLowerCase() == 'get') {
          loaded = true;
        }

        if (route.responseType == 'array') {
          updateAllItems(data);
          return items;
        } else if (route.responseType == 'one') {
          updateOneItem(data);
          return items[data[key]];
        } else if (route.responseType == 'remove') {
          // Ignores the response from the API but removes the item from our
          // collection.
          removeItem(item);
          return items;
        } else if (route.responseType == 'ignore' || typeof response.routeType == 'undefined') {
          // By default we will ignore everything sent back from the API.
          return data;
        } else {
          throw "Unknown route responseType '"+route.responseType+"' for route "+routeName;
        }
      });

      promises[promiseKey] = promise;
      return promise;
    };

    var updateAllItems = function(data) {
      // Add new items and update existing items with new values
      var currentKeys = {};
      angular.forEach(data, function(item) {
        updateOneItem(item);
        currentKeys[item[key]] = 1;
      });
      // Remove items from the array and index.
      for (var i=0; i < items.length; i++) {
        var currentItem = items[i]
        if (!currentKeys[currentItem[key]]) {
          items.splice(i, 1);
          delete itemIndex[currentItem[key]];
          i--; // decrement since we removed one value from the array
        }
      }
    };

    var updateOneItem = function(data) {
      injectItem(new model(data));
    };

    var removeItem = function(item) {
      for (var i=0; i < items.length; i++) {
        var currentItem = items[i];
        if (currentItem[key] == item[key]) {
          items.splice(i, 1);
          delete itemIndex[currentItem[key]]
          return;
        }
      }
    };

    var injectItem = function(item) {
      if (itemIndex[item[key]]) {
        angular.extend(itemIndex[item[key]], item);
      } else if (pendingItems[item[key]]) {
        itemIndex[item[key]] = angular.extend(pendingItems[item[key]], item);
        items.push(itemIndex[item[key]]);
        delete pendingItems[item[key]];
      } else {
        itemIndex[item[key]] = item;
        items.push(item);
      }
    };

    // Takes a url pattern and replaces variables with values from item as
    // mapped by the keys hash.  For example "/users/:id" becomes "/users/3".
    var composeUrl = function(item, url, keys) {
      var matches;
      while (matches = url.match(/:([^\/\?$]+)/)) {
        url = url.replace(matches[0], item[matches[1]]);
      }
      return url;
    };


    // PUBLIC INTERFACE ------------------------------------------------

    var SmartCollection = function() {};
    SmartCollection.prototype.items = function() { return items; };
    SmartCollection.prototype.item = function(keyValue) {
      if (typeof itemIndex[keyValue] !== 'undefined') {
        return itemIndex[keyValue];
      } else if (typeof pendingItems[keyValue] !== 'undefined') {
        return pendingItems[keyValue];
      } else if (typeof keyValue == 'object') {
        var obj = keyValue;
        keyValue = obj[key];
        pendingItems[keyValue] = new model(obj);
        return pendingItems[keyValue];
      } else {
        var obj = {};
        obj[key] = keyValue;
        pendingItems[keyValue] = new model(obj);
        return pendingItems[keyValue];
      }
    };

    // Create a function for each route dynamically
    angular.forEach(routes, function(route, routeName) {
      if (SmartCollection.prototype[routeName])
        throw "Cannot create a route using reserved name '"+routeName+"'";
      SmartCollection.prototype[routeName] = function(item) {
        return performRequest(routeName, item);
      };
    });

    return new SmartCollection();
  };
});