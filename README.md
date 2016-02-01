# ODB: A Javascript Object Database

ODB is a simple object database for storing Javascript objects. 

- The database stores the objects in the memory. You can dump the memory to JSON and laterwards restore the database from JSON.
- Inserting a object into the database also recursively inserts all dependend subobjects. You can control recursion by a check function.
- The database does not support SQL. Objects are stored with a key and retrieved by a key.
 
## Loading the Library

When using in the browser load the library by a script tag in HTML:
```HTML
<script src="odb.js" type="text/javascript"></script>
```
For node.js require the library by:
```
var odb = require('./odb');
```
## Basic Usage

Create an empty database:
```javascript
var db = new odb.DB();
```
Store an object with key 'notebook' in the database:
```javascript
db.put('notebook', {
    title: 'Notebook',
    price: 10,
    keywords: ['computer', 'mobile']
});
```
The subobjects (in this example 'keywords') of the object are stored recursively in the database.

Get an object from the database:
```javascript
var notebook = db.get('notebook');
```
Dump the database to JSON:
```javascript
var json = JSON.stringify(db.toJson());
```
Create a new database and fill it with data from JSON:
```javascript
db = new odb.DB({
    json: JSON.parse(json)
});
```
## Storing Objects with Circular References
Unlike JSON you can store objects with circular references in the object database. The database assigns IDs to the objects. Internally the object database uses the IDs for storing object references.

Example for storing objects with circular references:
```javascript
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
```

## Storing Instances of a Class in the Object Database

### Class Information by Property
Besides simple objects like ``[1,2,3]`` or ``{a:1, b:2}`` typically you want to store instances of a class (=type) in the object database. In Javascript classes are represented by a constructor function and a prototype.

Here is a simple class definition:
```javascript
window.mylib = {};

// constructor function
window.mylib.Collection = function() {
    this.init.apply(this, arguments);
};

// prototype
window.mylib.Collection.prototype = {
    type: 'mylib.Collection',
    init: function() {
        this.items = [];
    },
    add: function(item) {
        this.items.push(item);
    }
};
```
The prototype includes the property 'type' which store the name of the type. This is needed for the object database in order to restore objects. By default the object database assumes that the name of the type is a dot separated package path. The database follows the packagage path starting from window and expects to find the constructor function. Alternatively you can specify a custom [object factory](#custom-object-factory) which may be useful for nodejs.

The following snippet creates an instance of class 'Collection' and then stores the instance in the database:
```javascript
// create an instance of class Collection
var collection = new window.mylib.Collection();
collection.add(1);
collection.add(2);

// create database and store instance
var db = new odb.DB({
    typeProperty: 'type'
});
db.put('collection', collection);
```
When creating the database you can specify which property holds the type information. 

###Type Information via a Getter
Instead of a property each object could provide the type information via a getter method.

Class definition:

```javascript
 
 window.mylib = {};

// constructor function
window.mylib.Collection = function() {
    this.init.apply(this, arguments);
};

// prototype
window.mylib.Collection.prototype = {
    type: 'mylib.Collection',
    myGetType: function() {
        return this.type;
    },
    init: function() {
        this.items = [];
    },
    add: function(item) {
        this.items.push(item);
    }
};
```
Create an instance of the class and store it in the database:
```javascript
// create empty database
var db = new odb.DB({
    getType: 'myGetType'
});

var collection = new window.mylib.Collection();
collection.add(1);
collection.add(2);

db.put('collection', collection);
```
###Custom Object Factory

You can specify an object factory for creation of objects. The factory is called with the type information and returns an new object of the type.

```javascript
window.mylib = {};

// constructor function
window.mylib.Collection = function() {
    this.init.apply(this, arguments);
};

// prototype
window.mylib.Collection.prototype = {
    type: 'collection',
    init: function() {
        this.items = [];
    },
    add: function(item) {
        this.items.push(item);
    }
};

// create empty database 
// - type information is stored in property 'type' of class definition (prototype)
// - a custom object factory is used 
var db = new odb.DB({
    typeProperty: 'type',
    createObject: function(type) {
        switch (type) {
            case 'collection':
                return new window.mylib.Collection();
                break;
        }
    }
});

// store and instance of the object in the database
var collection = new window.mylib.Collection();
collection.add(1);
collection.add(2);
db.put('collection', collection);
```
## Controlling the Recursive Insertion Process
Objects and subobjects are inserted recursively into the database. In case you want to stop the recursion you can use a check function which is called before an object is inserted into the database.
```javascript
// create empty database with a check function
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
```

## IDs for the Objects 
The object database generates IDs for the objects in the database. Instead of relying on the automatic ID generation an object can provide its own ID. In the object database constructor you can define the name of an object property which stores the ID or the name of a method for getting the ID.

### Getting the ID from an Property
```javascript
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

// store object in db, not necessary to provide the id here
db.put(notebook);

// get object from db
notebook = db.get('4711');
```

### Getting the ID via a Getter

```javascript
// create empty database
// the id of an object is taken by calling the getter myGetId
var db = new odb.DB({
    getId: 'myGetId'
});

// create an object
var notebook = {
    id: '4711',
    price: 10,
    myGetId: function() {
        return this.id;
    }
};

// store object in db, not necessary to provide the id here
db.put(notebook);

// get object from db
notebook = db.get('4711');
```

## Constructor Reference

Create object database:
```javascript
var db = new odb.DB(options);
```
``options`` is an object with the following properties:
| Option| Meaning|
|-------|--------|
|generatedIdPrefix|prefix for objects ids generated by the database.|
|adminProperty    |name of the property which is used to store admin information| 
|getId|name of a method which is called to get the ID of an object|
|idProperty|name of the property which contains the ID of an object|
|getType|name of a method which is used to get the type of an object|
|typeProperty|name of the property which contains the type of an object|
|createObject|function for creating an object|
|checkInsertion|check function for controlling the recursive insertion process|





