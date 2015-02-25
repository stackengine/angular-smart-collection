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
assume anything about your API.  Here's an example of creating a new
smart collection of your own:

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

Every route will get its own function in the SmartCollection instance.  In the
above example, UserCollection.getAll() and UserCollection.update(user) are
dynamically defined.
