# SmartCollection for AngularJS

The SmartCollection service is a way to do CRUD operations on a collection of
objects through an API while maintaining a consistent local cache.

The key benefit of SmartCollection over most other CRUD tools is the
consistent local cache.  We make sure all object references are kept the same.
This cache can be referenced in Angular scopes such that any time the the
collection updates an object, the scope will automatically be re-rendered
(since the object references will not change).

    $scope.users = UserCollection.items();
    UserCollection.getAll();

At first, UserCollection.items() will return an empty array and later,
asynchronously, getAll() will populate that array.  But the array reference
will stay the same and never change.

All of the routes in SmartController are 100% user configured, we do not
assume anything about your API.  Every route will get its own function in the SmartCollection instance.

### Function Reference

There are only two functions that SmartCollection provides inherently:

* **items()** - Returns a reference to the collection array.  It will always
return the *same* reference to the *same* array every time it is called.  You
should *not* add or remove items from this array directly.

* **item(id)** - Returns a reference to a single model object from the collection,
referenced by "id".  If no match is found, null will be returned.

### Configuration

* Required parameters
  * **routes** - A hash representing all defined routes.  See the "Routing" section below.
  * **key** - A string representing the key name used to uniquely identify your model objects.
For example, 'id' if model.id is the primary key on your model.  Or 'UserId' for obj.UserId.
* Optional parameters
  * **model** - A model object to be used.  If none is provided, GenericModel will be used which is defined by SmartCollection. The constructor function must take just one argument, a plain JavaScript object with all your model attributes.

### Routing

Every route you define is given its own function on the SmartCollection instance.  In the example below, UserCollection.update() is a function created because the "update" route was define.  The route function accepts 0 or 1 parameters.  If a parameter is given, it is assumed to be a model object.

When defining routes, these are the availble parameters:

* Required parameters
  * **url** - The URL for this API call.  You can use colon-denoted parameters to add attributes from a model object.  Each colon-denoted parameter should have an associated urlKeys value.  Example: "/users.json" or "/users/3.json"
  * **method** - Any HTTP method accepted by $http.  Example: "get", "post", "delete", etc.

* Optional parameters
  * **responseType** - String.  Determines what happens when a successful response is received.  Default: 'ignore'
    * "_ignore_" - Do nothing. (default)
    * "_array_" - Response is an array of items that represents the entire collection.  New items will be created and added to the collection, existing items will have attributes merged, and anything in the existing collection that does not exist in the response array will be removed.
    * "_one_" - Response is a single item.  Using its primary key, it will be added or merged into the current collection.
    * "_remove_" - After a successful response is received, the item operated on by this route will be removed from the local collection array.
  * **urlKeys** - A hash that maps model attributes to url parameters.  Example: ```{id: 'id'}```
  * **transformRequestData(data)** - A function that transforms a model before it is sent as they parameter payload on the $http request.  This should return a plain JavaScript object with all the attributes you want to send to the HTTP request.
  * **transformResponseData(data)** - A function that transforms the response.data from $http before it is turned into a model object by SmartCollection.  This should return a plain JavaScript object with all the attributes (and any changes) you want to store in the model.

### Example

    app.factory('UserCollection', function(SmartCollection, UserModel) {
      return new SmartCollection({
        key: "id",
        model: UserModel,
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
    
    app.factory('UserModel', function() {
      var UserModel = function(attrs) {
        this.id = attrs.id;
        this.firstName = attrs.first_name;
        this.lastName = attrs.last_name;
      };
    
      UserModel.prototype.fullName = function() {
        return this.firstName+' '+this.lastName;
      };
    
      return UserModel;
    });
    
    app.controller('UsersController', function(UserCollection, $scope) {
      $scope.users = UserCollection.items();
      $scope.updateUser = function(user) {
        UserCollection.update(user).then(
          /* success */
          function() {
            alert(user.fullName()+' was saved successfully.");
          },
          /* error */
          function(response) {
            alert(user.fullName()+' could not be saved.  Server said: '+response.data);
          }
        );
      };
      
      // Lazy-load the collection asynchronously.
      UserCollection.getAll();
    });
