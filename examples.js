/* global window, console */
(function () {

	var odb = window.odb;

	var example1 = function () {

		// create empty database
		var db = new odb.DB();

		// store object with key 'notebook' in db
		// subobjects are added recursively to the DB
		db.put('notebook', {
			title: 'Notebook',
			price: 10,
			keywords: ['computer', 'mobile']
		});

		// serialize db to a json (save the json on disk or in real db)
		var json = JSON.stringify(db.toJson());

		// create a database and fill with the objects from json
		db = new odb.DB({
			json: JSON.parse(json)
		});

		// get an object from the database
		var notebook = db.get('notebook');

	};

	var example2 = function () {

		// create empty database
		var db = new odb.DB();

		// circular object references
		var o1 = {
			id: '1'
		};
		var o2 = {
			id: '2'
		};
		var o3 = {
			id: '3'
		};
		o1.p = o2;
		o2.p = o3;
		o3.p = o1;

		// store o1 (and via recursion o2 and o3) in the database
		db.put('o1', o1);

		db.debugReload();
		o1 = db.get('o1');
	};

	var example3 = function () {

		// create empty database
		// the id of an object is taken from the property 'id'
		var db = new odb.DB({
			idProperty: 'id'
		});

		// create an object
		var notebook = {
			id: '4711',
			price: 10
		};

		// store object in db
		db.put(notebook);

		// get object from db
		notebook = db.get('4711');
	};

	var example4 = function () {

		// create empty database
		// the id of an object is taken by calling the getter myGetId
		var db = new odb.DB({
			getId: 'myGetId'
		});

		// create an object
		var notebook = {
			id: '4711',
			price: 10,
			myGetId: function () {
				return this.id;
			}
		};

		// store object in db
		db.put(notebook);

		// get object from db
		notebook = db.get('4711');
	};

	var example5 = function () {

		window.mylib = {};

		window.mylib.Collection = function () {
			this.init.apply(this, arguments);
		};
		window.mylib.Collection.prototype = {
			type: 'mylib.Collection',
			init: function () {
				this.items = [];
			},
			add: function (item) {
				this.items.push(item);
			}
		};

		// create empty database
		var db = new odb.DB({
			typeProperty: 'type'
		});

		var collection = new window.mylib.Collection();
		collection.add(1);
		collection.add(2);

		db.put('collection', collection);

		db.debugReload();

		collection = db.get('collection');

	};

	var example6 = function () {

		window.mylib = {};

		window.mylib.Collection = function () {
			this.init.apply(this, arguments);
		};
		window.mylib.Collection.prototype = {
			type: 'mylib.Collection',
			myGetType: function () {
				return this.type;
			},
			init: function () {
				this.items = [];
			},
			add: function (item) {
				this.items.push(item);
			}
		};

		// create empty database
		var db = new odb.DB({
			getType: 'myGetType'
		});

		var collection = new window.mylib.Collection();
		collection.add(1);
		collection.add(2);

		db.put('collection', collection);

		db.debugReload();

		collection = db.get('collection');

	};

	var example7 = function () {

		window.mylib = {};

		window.mylib.Collection = function () {
			this.init.apply(this, arguments);
		};
		window.mylib.Collection.prototype = {
			type: 'collection',
			init: function () {
				this.items = [];
			},
			add: function (item) {
				this.items.push(item);
			}
		};

		// create empty database
		var db = new odb.DB({
			typeProperty: 'type',
			createObject: function (type) {
				switch (type) {
				case 'collection':
					return new window.mylib.Collection();
				}
			}
		});

		var collection = new window.mylib.Collection();
		collection.add(1);
		collection.add(2);

		db.put('collection', collection);

		db.debugReload();

		collection = db.get('collection');

	};

	var example8 = function () {

		// create empty database
		var db = new odb.DB({
			checkInsertion: function (obj, property, value) {
				if (value.skip) {
					return false;
				}
				return true;
			}
		});

		// put an object into the database
		// subobjects are inserted recursively 
		// except q which is skipped because of the checkInsertion function
		db.put('a', {
			p: {
				x: 1,
				y: 2
			},
			q: {
				skip: true,
				u: 1,
				v: 2
			}
		});

		db.debugReload();

		var a = db.get('a');

	};


	example1();
	example2();
	example3();
	example4();
	example5();
	example6();
	example7();
	example8();


})();