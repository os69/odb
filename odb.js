/* global window, require, console, exports */
(function (exports) {

	exports.DB = function () {
		this._init.apply(this, arguments);
	};

	exports.DB.prototype = {

		_init: function (options) {

			// internal 
			this.objectMap = {};
			this.serializedObjectMap = {};
			this.processingMap = {};
			this.maxId = 0;

			// options
			options = options || {};
			this.generatedIdPrefix = options.generatedIdPrefix || '__';
			this.adminProperty = options.adminProperty || '__odb';
			this.hooks = {
				getId: options.getId,
				idProperty: options.idProperty,
				getType: options.getType,
				typeProperty: options.typeProperty,
				createObject: options.createObject,
				checkInsertion: options.checkInsertion
			};

			// defaults
			if (!this.hooks.getType && !this.hooks.typeProperty) {
				this.hooks.typeProperty = 'type';
			}

			// deserialize
			if (options.json) {
				this.fromJson(options.json);
			}
		},

		put: function () {

			// parse function input parameters
			var obj, id;
			switch (arguments.length) {
			case 1:
				obj = arguments[0];
				break;
			case 2:
				id = arguments[0];
				obj = arguments[1];
				break;
			}

			// store object 
			if (this._getType(obj) === 'simple') {
				// simple type (integer, string, ...) 
				if (!id) {
					throw 'No id for ' + obj;
				}
				this.objectMap[id] = obj;
			} else {
				// object or list
				this._fillAdminData(obj, id);
				this.objectMap[this._getId(obj)] = obj;
			}
		},

		get: function (id) {
			return this.objectMap[id];
		},

		toJson: function () {
			this.serializedObjectMap = {};
			this.processingMap = {};
			for (var id in this.objectMap) {
				if (this._isGeneratedId(id)) {
					continue;
				}
				var obj = this.objectMap[id];
				if (this._getType(obj) === 'simple') {
					this.serializedObjectMap[id] = obj;
					this.processingMap[id] = true;
				} else {
					this._serializeObj(obj);
				}
			}
			this._garbageCollection();
			return this.serializedObjectMap;
		},

		fromJson: function (json) {
			this.processingMap = {};
			this.serializedObjectMap = json;
			for (var id in this.serializedObjectMap) {
				var serializedObject = this.serializedObjectMap[id];
				if (this._getType(serializedObject) === 'simple') {
					this.objectMap[id] = serializedObject;
					this.processingMap[id] = true;
				} else {
					this._deserializeObject(serializedObject);
				}
			}
		},

		_generateId: function () {
			return this.generatedIdPrefix + (++this.maxId);
		},

		_isGeneratedId: function (id) {
			return id.slice(0, this.generatedIdPrefix.length) === this.generatedIdPrefix;
		},

		_getType: function (obj) {
			if (obj === undefined || obj === null) {
				return 'simple';
			}
			if (typeof (obj) === 'string') return 'simple';
			if (typeof (obj) === 'number') return 'simple';
			if (typeof (obj) === 'boolean') return 'simple';
			if (typeof (obj) === 'function') return 'function';
			if (typeof (obj) === 'object') {
				if (Object.prototype.toString.call(obj) === '[object Array]') return 'list';
				return 'object';
			}
			throw "Not supported type:" + typeof (obj);
		},

		_getId: function (obj) {
			return obj[this.adminProperty].id;
		},

		_fillAdminData: function (obj, id) {

			// generate admin data object
			var adminData = obj[this.adminProperty];
			if (!adminData) {
				adminData = {};
				obj[this.adminProperty] = adminData;
			}

			// set id
			if (!adminData.id) {
				adminData.id = id;
			}
			if (!adminData.id && this.hooks.getId) {
				var getIdMethod = obj[this.hooks.getId];
				if (getIdMethod) {
					adminData.id = getIdMethod.apply(obj);
				}
			}
			if (!adminData.id && this.hooks.idProperty) {
				adminData.id = obj[this.hooks.idProperty];
			}
			if (!adminData.id) {
				adminData.id = this._generateId();
			}

			// set type
			if (!adminData.type && this.hooks.getType) {
				var getTypeMethod = obj[this.hooks.getType];
				if (getTypeMethod) {
					adminData.type = getTypeMethod.apply(obj);
				}
			}
			if (!adminData.type && this.hooks.typeProperty) {
				adminData.type = obj[this.hooks.typeProperty];
			}
			if (!adminData.type) {
				adminData.type = this._getType(obj);
			}

		},

		_garbageCollection: function () {
			var id;
			// collect unused objects
			var delIds = [];
			for (id in this.objectMap) {
				if (!this.processingMap[id]) {
					delIds.push(id);
				}
			}
			// deleted unused objects
			for (var i = 0; i < delIds.length; ++i) {
				id = delIds[i];
				delete this.objectMap[id];
			}
		},

		_serializeObj: function (obj) {

			// get id
			this._fillAdminData(obj);
			var id = this._getId(obj);

			// update processing map
			if (this.processingMap[id]) {
				return;
			}
			this.processingMap[id] = true;

			// update object map
			this.objectMap[id] = obj;

			// update serialized object map
			var serializedObject = {};

			this.serializedObjectMap[id] = serializedObject;

			// set admin data
			var adminData = obj[this.adminProperty];
			serializedObject[this.adminProperty] = adminData;

			// process properties of object
			adminData.referenceProperties = {};
			for (var property in obj) {
				if (!obj.hasOwnProperty(property) || property === this.adminProperty) {
					continue;
				}
				var value = obj[property];
				if (this.hooks.checkInsertion) {
					if (!this.hooks.checkInsertion.apply(this, [obj, property, value])) {
						continue;
					}
				}
				switch (this._getType(value)) {
				case 'simple':
					serializedObject[property] = value;
					break;
				case 'object':
				case 'list':
					this._serializeObj(value);
					serializedObject[property] = '#' + this._getId(value);
					adminData.referenceProperties[property] = true;
					break;
				}
			}
			return serializedObject;
		},

		_deserializeObject: function (serializedObject) {

			var adminData;

			// already processed?
			var id = this._getId(serializedObject);
			if (this.processingMap[id]) {
				return this.objectMap[id];
			}
			this.processingMap[id] = true;

			// update max id
			if (this._isGeneratedId(id)) {
				var intId = parseInt(id.slice(this.generatedIdPrefix.length));
				this.maxId = Math.max(intId, this.maxId);
			}

			// create object if necessary
			adminData = serializedObject[this.adminProperty];
			var object = this.objectMap[id];
			if (!object) {
				switch (serializedObject[this.adminProperty].type) {
				case 'object':
					object = {};
					break;
				case 'list':
					object = [];
					break;
				default:
					object = this._createObject(adminData.type);
				}
				this.objectMap[id] = object;
			}

			// set admin data
			object[this.adminProperty] = adminData;

			// deserialize properties of object
			for (var property in serializedObject) {
				var value = serializedObject[property];
				if (adminData.referenceProperties[property]) {
					value = this._deserializeObject(this.serializedObjectMap[value.slice(1)]);
				}
				object[property] = value;
			}

			return object;
		},

		_createObject: function (type) {
			if (this.hooks.createObject) {
				return this.hooks.createObject.apply(this, [type]);
			} else {
				var constructorFunction = this._getByPackagePath(type);
				return Object.create(constructorFunction.prototype);
			}
		},

		_getByPackagePath: function (path) {
			var parts = path.split('.');
			var obj = window;
			for (var i = 0; i < parts.length; ++i) {
				var part = parts[i];
				obj = obj[part];
			}
			return obj;
		},

		debugReload: function () {
			var json = JSON.parse(JSON.stringify(this.toJson()));
			this._init.apply(this, [{
				generatedIdPrefix: this.generatedIdPrefix,
				adminProperty: this.adminProperty,
				getId: this.hooks.getId,
				idProperty: this.hooks.idProperty,
				getType: this.hooks.getType,
				typeProperty: this.hooks.typeProperty,
				createObject: this.hooks.createObject
			}]);
			this.fromJson(json);
		},

		debugStatistic: function () {
			var statistic = {};
			var type;
			for (var id in this.serializedObjectMap) {
				var obj = this.serializedObjectMap[id];
				type = obj.type;
				var count = statistic[type];
				count = count !== undefined ? count + 1 : 1;
				statistic[type] = count;
			}
			console.log('--odb statistic begin');
			for (type in statistic) {
				console.log(type + ':' + statistic[type]);
			}
			console.log('--odb statistic end');
		}

	};


})(typeof exports === 'undefined' ? this.odb = {} : exports);