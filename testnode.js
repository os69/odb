/* global require, console */
var odb = require('./odb');

var db = new odb.DB();

var a = {
	a: 1,
	b: 2
};

db.put('a', a);
db.debugReload();

a = db.get('a');
console.log(a);



var A = function () {
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


db = new odb.DB({
	typeProperty: 'type',
	createObject: function (type) {
		switch (type) {
		case 'A':
			return new A();
		}
	}
});



a = new A(13);
db.put('a', a);
db.debugReload();
a = db.get('a');
console.log(a.getNumber());