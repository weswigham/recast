var assert = require("assert");
var types = require("./types");
var Node = types.namedTypes.Node;

function FastPath(value) {
    assert.ok(this instanceof FastPath);
    this.stack = [value];
}

var FPp = FastPath.prototype;
module.exports = FastPath;

FastPath.from = function(obj) {
    if (obj instanceof FastPath) {
        return obj.copy();
    }

    if (obj instanceof types.NodePath) {
        var copy = Object.create(FastPath.prototype);
        var stack = [obj.value];
        for (var pp; (pp = obj.parentPath); obj = pp)
            stack.push(obj.name, pp.value);
        copy.stack = stack.reverse();
        return copy;
    }

    return new FastPath(obj);
};

FPp.copy = function copy() {
    var copy = Object.create(FastPath.prototype);
    copy.stack = this.stack.slice(0);
    return copy;
};

FPp.getName = function getName() {
    var s = this.stack;
    var len = s.length;
    if (len > 1) {
        return s[len - 2];
    }
    return null;
};

FPp.getValue = function getValue() {
    var s = this.stack;
    return s[s.length - 1];
};

FPp.getNode = function getNode() {
    var s = this.stack;

    for (var i = s.length - 1; i >= 0; i -= 2) {
        var value = s[i];
        if (Node.check(value)) {
            return value;
        }
    }

    return null;
};

FPp.getParentNode = function getParentNode() {
    var s = this.stack;
    var count = 0;

    for (var i = s.length - 1; i >= 0; i -= 2) {
        var value = s[i];
        if (Node.check(value) &&
            count++ > 0) {
            return value;
        }
    }

    return null;
};

FPp.getRootValue = function getRootValue() {
    var s = this.stack;
    if (s.length % 2 === 0) {
        return s[1];
    }
    return s[0];
};

FPp.needsParens = function needsParens() {
    return false; // TODO
};

FPp.call = function call(callback) {
    var s = this.stack;
    var origLen = s.length;
    var value = s[origLen - 1];
    var argc = arguments.length;
    for (var i = 1; i < argc; ++i) {
        var name = arguments[i];
        value = value[name];
        s.push(name, value);
    }
    var result = callback(this);
    s.length = origLen;
    return result;
};

FPp.each = function each(callback) {
    var s = this.stack;
    var origLen = s.length;
    var value = s[origLen - 1];
    var argc = arguments.length;

    for (var i = 1; i < argc; ++i) {
        var name = arguments[i];
        value = value[name];
        s.push(name, value);
    }

    for (var i = 0; i < value.length; ++i) {
        s.push(i, value[i]);
        callback(this, i);
        s.length -= 2;
    }

    s.length = origLen;
};

FPp.map = function map(callback) {
    var s = this.stack;
    var origLen = s.length;
    var value = s[origLen - 1];
    var argc = arguments.length;
    var result = [];

    for (var i = 1; i < argc; ++i) {
        var name = arguments[i];
        value = value[name];
        s.push(name, value);
    }

    for (var i = 0; i < value.length; ++i) {
        s.push(i, value[i]);
        result[i] = callback(this, i);
        s.length -= 2;
    }

    s.length = origLen;

    return result;
};
