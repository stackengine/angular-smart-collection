describe('SmartCollection', function() {

  ////////////////////////////////////////////////////////////////////////////////
  // Single response
  ////////////////////////////////////////////////////////////////////////////////
  describe('one response', function() {
    var $httpBackend;
    var SmartCollection;
    var TestCollection;
    function TestModel(data) {
      angular.extend(this, data);
    };

    beforeEach(module('SmartCollection'));
    beforeEach(inject(function(_$httpBackend_, _SmartCollection_) {
      SmartCollection = _SmartCollection_;
      TestCollection = new SmartCollection({
        model: TestModel,
        routes: {
          getOne: {
            method: 'get',
            responseType: 'one',
            url: '/test/:id'
          }
        }
      });

      $httpBackend = _$httpBackend_;
      $httpBackend.when('GET', '/test/1').respond({id: 1, name:"one"});
      $httpBackend.when('GET', '/test/2').respond({id: 2, name:"two"});
    }))

    ///////////////////////////////////////////////////////////////////////////////

    it('accepts integer parameter', function() {
      TestCollection.getOne(1).then(function() {
        expect(TestCollection.item(1).name).toEqual('one');
      });
      $httpBackend.flush();
    });

    it('accepts object parameter', function() {
      TestCollection.getOne({id:2}).then(function() {
        expect(TestCollection.item(2).name).toEqual('two');
      });
      $httpBackend.flush();
    });

    it('maintains object reference', function() {
      expect(TestCollection.items().length).toEqual(0);
      var item = TestCollection.item(1);
      item.refCheck = 123;
      expect(TestCollection.items().length).toEqual(0);
      TestCollection.getOne(item).then(function() {
        expect(item.refCheck).toEqual(123);
        expect(TestCollection.item(1).refCheck).toEqual(123);
        expect(TestCollection.items()[0].refCheck).toEqual(123);
      });
      $httpBackend.flush();
    });

    it('creates a model object for pending items', function() {
      expect(TestCollection.items().length).toEqual(0);
      var item = TestCollection.item(1);
      expect(item.constructor.name).toEqual('TestModel');
    });
  });

  ////////////////////////////////////////////////////////////////////////////////
  // Piggybacks requests
  ////////////////////////////////////////////////////////////////////////////////
  describe('request piggybacking', function() {
    var $httpBackend;
    var SmartCollection;
    var TestCollection;
    var responseCounter, promiseCounter;

    beforeEach(module('SmartCollection'));
    beforeEach(inject(function(_$httpBackend_, _SmartCollection_) {
      SmartCollection = _SmartCollection_;
      $httpBackend = _$httpBackend_;

      responseCounter = 0;
      promiseCounter = 0;
      TestCollection = new SmartCollection({
        routes: {
          getOne: {
            method: 'get',
            responseType: 'one',
            url: '/test/:id',
            transformResponseData: function(responseData, item) {
              responseCounter++;
              return item;
            }
          }
        }
      });
      $httpBackend.when('GET', '/test/1').respond({id: 1, name:"one"});
      $httpBackend.when('GET', '/test/2').respond({id: 2, name:"two"});
    }))

    ///////////////////////////////////////////////////////////////////////////////

    it('reuses the same promise', function() {
      TestCollection.getOne(1).then(function() { promiseCounter++; });
      TestCollection.getOne(1).then(function() { promiseCounter++; });
      $httpBackend.flush();

      expect(responseCounter).toEqual(1);
      expect(promiseCounter).toEqual(2);
    });

    it('resets the promise cache after each request', function() {
      TestCollection.getOne(1).then(function() { promiseCounter++; });
      $httpBackend.flush();
      TestCollection.getOne(1).then(function() { promiseCounter++; });
      $httpBackend.flush();

      expect(responseCounter).toEqual(2);
      expect(promiseCounter).toEqual(2);
    });

    it('returns a new promise for separate requests', function() {
      TestCollection.getOne(1).then(function() { promiseCounter++; });
      TestCollection.getOne(2).then(function() { promiseCounter++; });
      $httpBackend.flush();

      expect(responseCounter).toEqual(2);
      expect(promiseCounter).toEqual(2);
    });
  });



  ////////////////////////////////////////////////////////////////////////////////
  // Transformed request and response
  ////////////////////////////////////////////////////////////////////////////////
  describe('transform request', function() {
    var $httpBackend;
    var SmartCollection;
    var TestCollection;
    function TestModel(data) {
      angular.extend(this, data);
    };

    beforeEach(module('SmartCollection'));
    beforeEach(inject(function(_$httpBackend_, _SmartCollection_) {
      SmartCollection = _SmartCollection_;
      TestCollection = new SmartCollection({
        model: TestModel,
        routes: {
          getOne: {
            method: 'get',
            responseType: 'one',
            url: '/test/:id',
            transformResponseData: function(responseData, item) {
              return {worked:true};
            }
          }
        }
      });

      $httpBackend = _$httpBackend_;
      $httpBackend.when('GET', '/test/1').respond({id: 1, name:"one"});
      $httpBackend.when('GET', '/test/2').respond({id: 2, name:"two"});
    }))

    ///////////////////////////////////////////////////////////////////////////////

    it('transforms the response', function() {
      TestCollection.getOne(1).then(function() {
        expect(TestCollection.items()[0].worked).toEqual(true);
      });
      $httpBackend.flush();
    });
  });


  ////////////////////////////////////////////////////////////////////////////////
  // Prefixed Responses
  ////////////////////////////////////////////////////////////////////////////////
  describe('one prefixed response', function() {
    var $httpBackend;
    var SmartCollection;
    var TestCollection;
    function TestModel(data) {
      angular.extend(this, data);
    };

    beforeEach(module('SmartCollection'));
    beforeEach(inject(function(_$httpBackend_, _SmartCollection_) {
      SmartCollection = _SmartCollection_;
      TestCollection = new SmartCollection({
        model: TestModel,
        routes: {
          getOne: {
            method: 'get',
            responsePrefix: 'prefix',
            responseType: 'one',
            url: '/test/:id'
          }
        }
      });

      $httpBackend = _$httpBackend_;
      $httpBackend.when('GET', '/test/1').respond({prefix: {id: 1, name:"one"}});
      $httpBackend.when('GET', '/test/2').respond({prefix: {id: 2, name:"two"}});
    }))

    ///////////////////////////////////////////////////////////////////////////////

    it('parses prefixed responses', function() {
      TestCollection.getOne(1).then(function() {
        expect(TestCollection.item(1).name).toEqual('one');
      });
      $httpBackend.flush();
    });
  });
})
