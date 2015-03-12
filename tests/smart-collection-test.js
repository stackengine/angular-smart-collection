describe('SmartCollection', function() {
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
    })

  })
})