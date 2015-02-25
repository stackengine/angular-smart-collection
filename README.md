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
return the /same/ reference to the /same/ array every time it is called.  You
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

### Example: Creating a SmartCollection

    app.factory('UserCollection', function(SmartCollection) {
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
    
    var User = function(attrs) {
      this.id = attrs.id;
      this.firstName = attrs.first_name;
      this.lastName = attrs.last_name;
    }
    user.prototype.fullName = function() {
      return this.firstName+' '+this.lastName;
    }
    
### Example Usage
    
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
        }
        
        // Lazy-load the collection asynchronously.
        UserCollection.getAll();
    });
