
// source: https://stackoverflow.com/questions/7837456/comparing-two-arrays-in-javascript
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a false value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}



// Parent class constructor
function Parent() {
  this.a = 42;
}

// Parent class method
Parent.prototype.method = function method() {};

// Child class constructor
function Child() {
  Parent.call(this);
  this.b = 3.14159
}

// Inherit from the parent class
Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;

// Child class method
Child.prototype.method = function method() {
  Parent.prototype.method.call(this);
};

// Instantiate
this.instance = new Child();

/*
 * User Object Model
 */

function User() {
	this.username = '';
	this.email = '';
	this.password = '';
	
}

User.prototype.method = function method() {};

