/*

SmartCollection

The SmartCollection service is a way to do CRUD operations on a collection of
objects through an API while maintaining a consistent local cache.

The key benefit of SmartCollection over most other CRUD tools is the
consistent local cache.  We make sure all object references are kept the same.
This cache can be referenced in Angular scopes such that any time the the
collection updates an object, the scope will automatically be re-rendered
(since the object references will not change).

Example usage in a controller:
  ---------------------------------------------
  $scope.users = UserCollection.items();
  UserCollection.getAll();
  ---------------------------------------------

At first, UserCollection.items() will return an empty array and later,
asynchronously, getAll() will populate that array.  But the array reference
will stay the same and never change.

All of the routes in SmartController are 100% user configured, we do not
assume anything about your API.  Here's an example of creating a new
smart collection of your own:
  ---------------------------------------------
  app.factory('UserCollection', function(SmartCollection) {
    return new SmartCollection({
      key: "id",
      routes: {
        getAll: {
          method: 'get',
          responseType: 'array',
          url: '/users'
        },
        update: {
          method: 'put',
          responseType: 'one',
          url: '/users/:id',
          urlKeys: {id: 'id'}
        }
      }
    })
  });
  ---------------------------------------------

Every route will get its own function in the SmartCollection instance.  In the
above example, UserCollection.getAll() and UserCollection.update(user) are
dynamically defined.

*/
angular.module('SmartCollection', [])
.factory('SmartCollection', function($http){
  return function(config) {

    var loaded = false;
    var routes = config.routes || {};
    var key = config.key || 'id';
    var items = [];
    var itemIndex = {};
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

      // Compose the URL we will be using.
      var url = route.url;
      if (route.urlKeys) {
        url = composeUrl(item, route.url, route.urlKeys);
      }

      // Transform the parameters if necessary.
      var params = item;
      if (route.transformRequestData) {
        params = route.transformRequestData(item);
      }

      return $http[route.method](url, params).then(function(response) {
        var data = response.data;
        if (route.transformResponseData) {
          data = route.transformResponseData(response.data)
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
          return items;
        } else {
          throw "Unknown route responseType '"+route.responseType+"' for route "+routeName;
        }
      });
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
      } else {
        itemIndex[item[key]] = item;
        items.push(item);
      }
    };

    // Takes a url pattern and replaces variables with values from item as
    // mapped by the keys hash.  For example "/users/:id" becomes "/users/3".
    var composeUrl = function(item, url, keys) {
      angular.forEach(keys, function(v,k) {
        url = url.replace(':'+k, item[v])
      })
      return url;
    };


    // PUBLIC INTERFACE ------------------------------------------------

    var SmartCollection = function() {};
    SmartCollection.prototype.items = function() { return items; };
    SmartCollection.prototype.item = function(keyValue) { return itemIndex[keyValue]; };

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