/* global window, console */
(function () {

	var odb = window.odb;

	var check = function (condition, text) {
		if (!condition) {
			console.log(text);
			throw 'check error';
		}
	};

	var test1 = function () {
		var db, a, b, c, a2, b2, c2, json;

		// store integer
		db = new odb.DB();
		db.put('a', 1);
		check(db.get('a') === 1);
		db.debugReload();
		check(db.get('a') === 1);

		// store object
		db = new odb.DB();
		db.put('a', {
			a: 1,
			b: 2,
			c: [1, 2, 3]
		});
		a = db.get('a');
		check(a.a === 1);
		check(a.b === 2);
		check(a.c[0] === 1);
		check(a.c[1] === 2);
		check(a.c[2] === 3);
		db.debugReload();
		a = db.get('a');
		check(a.a === 1);
		check(a.b === 2);
		check(a.c[0] === 1);
		check(a.c[1] === 2);
		check(a.c[2] === 3);

		// circular references
		db = new odb.DB();
		a = {};
		b = {};
		c = {};
		a.pointer = b;
		b.pointer = c;
		c.pointer = a;
		db.put('a', a);
		a2 = db.get('a');
		check(a2 === a);
		check(a2.pointer === b);
		check(a2.pointer.pointer === c);
		check(a2.pointer.pointer.pointer === a);
		db.debugReload();
		a2 = db.get('a');
		check(a2.pointer.pointer.pointer === a2);

		// list
		db = new odb.DB();
		db.put('a', [
            [0, 1],
            [2, 3]
        ]);
		a = db.get('a');
		check(a[0][0] === 0);
		check(a[0][1] === 1);
		check(a[1][0] === 2);
		check(a[1][1] === 3);
		db.debugReload();
		a = db.get('a');
		check(a[0][0] === 0);
		check(a[0][1] === 1);
		check(a[1][0] === 2);
		check(a[1][1] === 3);

		// garbage collection
		db = new odb.DB();
		a = [{
			a: 1
        }, {
			a: 2
        }, {
			a: 3
        }];
		db.put('a', a);
		db.debugReload();
		a = db.get('a');
		check(db.maxId === 3);
		check(a[0].a === 1);
		check(a[1].a === 2);
		check(a[2].a === 3);
		a.splice(2, 1);
		db.debugReload();
		a = db.get('a');
		check(db.maxId === 2);
		check(a[0].a === 1);
		check(a[1].a === 2);

		// test null pointer
		db = new odb.DB();
		db.put('a', {
			p: null
		});
		db.debugReload();
		a = db.get('a');
		check(a.p === null);

		// test null pointer
		db = new odb.DB();
		db.put('a', null);
		db.debugReload();
		a = db.get('a');
		check(a === null);

		// test undef
		db = new odb.DB();
		db.put('a', {
			p: 1,
			q: undefined
		});
		db.debugReload();
		a = db.get('a');
		check(a.p === 1);
		check(a.q === undefined);

		// test undef
		db = new odb.DB();
		db.put('a', undefined);
		db.debugReload();
		a = db.get('a');
		check(a === undefined);

		// test reload
		db = new odb.DB();
		a = {
			list: [1, 2, 3]
		};
		db.put('a', a);
		json = JSON.stringify(db.toJson());

		db = new odb.DB();
		a = {
			list: [1, 2]
		};
		db.put('a', a);
		db.fromJson(JSON.parse(json));
		check(a.list[2] === 3);

		db = new odb.DB();
		a = {
			list: [1, 2, 3, 4]
		};
		db.put('a', a);
		db.fromJson(JSON.parse(json));
		check(a.list[3] === undefined);

		// id property
		db = new odb.DB({
			idProperty: 'myId'
		});
		a = [{
			a: 1
        }, {
			a: 2
        }, {
			myId: 'b',
			a: 3
        }];
		a.myId = 'a';
		db.put(a);
		db.debugReload();
		a = db.get('a');
		check(a[0].a === 1);
		b = db.get('b');
		check(b.a === 3);

		// id getter
		db = new odb.DB({
			getId: 'getMyId'
		});
		a = [{
			a: 1
        }, {
			a: 2
        }, {
			getMyId: function () {
				check(this === a[2]);
				return 'b';
			},
			a: 3
        }];
		a.getMyId = function () {
			check(this === a);
			return 'a';
		};
		db.put(a);
		db.debugReload();
		a = db.get('a');
		check(a[0].a === 1);
		b = db.get('b');
		check(b.a === 3);

	};

	var test2 = function () {

		var A = window.A = function () {
			this.init.apply(this, arguments);
		};
		A.prototype = {
			type: 'A',
			constructor: A,
			myGetType: function () {
				return this.type;
			},
			init: function (number) {
				this.number = number;
			},
			getNumber: function () {
				return this.number;
			}
		};

		var db = new odb.DB({
			typeProperty: 'type'
		});
		var a = new A(1);
		db.put('a', a);
		db.debugReload();
		a = db.get('a');
		check(a.getNumber() === 1);
		check(a.constructor === A);

		db = new odb.DB({
			getType: 'myGetType'
		});
		a = new A(1);
		db.put('a', a);
		db.debugReload();
		a = db.get('a');
		check(a.getNumber() === 1);

		db = new odb.DB({
			getType: 'myGetType',
			createObject: function (type) {
				return new A();
			}
		});
		a = new A(1);
		db.put('a', a);
		db.debugReload();
		a = db.get('a');
		check(a.getNumber() === 1);

	};


	var test3 = function () {

		var db = new odb.DB();
		var a = {
			a: [{
				x: 1
			}, {
				x: 2
			}, {
				x: 3
			}]
		};
		db.put('a', a);
		db.debugReload();
		a = db.get('a');
		check(a.a[0].x === 1);
		check(a.a[1].x === 2);
		check(a.a[2].x === 3);
		a.a.splice(1, 1);
		db.debugReload();
		a = db.get('a');
		check(a.a[0].x === 1);
		check(a.a[1].x === 3);


	};

	var test4 = function () {

		var db = new odb.DB({
			checkInsertion: function (obj, property, value) {
				if (property === 'd') {
					return false;
				}
				return true;
			}
		});
		var a = {
			a: [{
				x: 1
			}, {
				x: 2
			}, {
				x: 3
			}],
			b: {
				c: 1,
				d: 2
			}
		};

		db.put('a', a);
		db.debugReload();
		a = db.get('a');




	};

	test1();
	test2();
	test3();
	test4();
	console.log('finished');



	// using in node


})();