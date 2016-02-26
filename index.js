/**
 * Default options.
 *
 * @type {Object}
 */
exports.options = {
    // merge all passed/found config files, see `cjson.extend`
    merge: false,
    // allows you to do some string replacements, see `cjson.replace`.
    replace: null,
    // freeze config recursively, see `cjson.freeze`
    freeze: false,
    // you can use any other extension for your config files, f.e. *.cjson
    ext: '.json'
}

/**
 * Remove single and multilie comments. Make sure to
 * leave them inside of strings.
 *
 * @param {String} json file.
 * @return {String} json without comments.
 */
exports.decomment = function(str) {
    var i,
        curChar, nextChar,
        inString = false,
        inComment = false,
        newStr = '';

    for (i = 0; i < str.length; ++i) {
        curChar = str.charAt(i);
        nextChar = str.charAt(i + 1);

        // it's either closing or opening inString and it is not escaped
        if (!inComment && curChar === '"' && str.charAt(i - 1) !== '\\') {
            inString = !inString;
        }

        // we are not inside of a string
        if (!inString) {
            // singleline comment start
            if (!inComment && curChar + nextChar === '//') {
                ++i;
                inComment = 1;
            // singleline comment end
            } else if (inComment === 1 && curChar === '\n') {
                inComment = false;
            // multiline comment start
            } else if (!inComment && curChar + nextChar === '/*') {
                ++i;
                inComment = 2;
                curChar = '';
            // multiline comment end
            } else if (inComment === 2 && curChar + nextChar === '*/') {
                ++i;
                inComment = false;
                curChar = '';
            }

            if (inComment) {
                curChar = '';
            }
        }

        newStr += curChar;
    }


    return newStr;
};

/**
 * Decomment the string and parse json.
 *
 * @param {String} json.
 * @param {Function} [reviver] will be called for every key and value at every
 *     level of the final result.
 * @return {Object} parsed json object.
 */
exports.parse = function(str, reviver) {
    return exports.options.parse(exports.decomment(str), reviver);
};

/**
 * Replace templates with data. {{toReplace}}
 *
 * @param {String} json.
 * @param {Object} data data hash.
 * @return {String} json string with replaced data.
 */
exports.replace = function(str, data) {
    return str.replace(/\{\{([^}]+)\}\}/g, function(match, search) {
        return data[search] ? data[search] : match;
    });
};

/**
 * Merge objects to the first one
 *
 * @param {Boolean|Object} deep if set true, deep merge will be done.
 * @param {Object} obj1 any object.
 * @param {Object} obj2 any object.
 * @return {Object} target merged object.
 */
exports.extend = (function() {
    var toString = Object.prototype.toString,
        obj = '[object Object]';

    return function extend(deep, obj1, obj2 /*, obj1, obj2, obj3 */) {
        // take first argument, if its not a boolean
        var args = arguments,
            i = deep === true ? 1 : 0,
            key,
            target = args[i];

        for (++i; i < args.length; ++i) {
            for (key in args[i]) {
                if (deep === true &&
                    target[key] &&
                    // if not doing this check you may end in
                    // endless loop if using deep option
                    toString.call(args[i][key]) === obj &&
                    toString.call(target[key]) === obj) {

                    // create a copy of target object to avoid subobjects changes
                    target[key] = extend(deep, {}, target[key]);

                    extend(deep, target[key], args[i][key]);
                } else {
                    target[key] = args[i][key];
                }
            }
        }

        return target;
    };
}());

/**
 * Freeze the object recursively.
 *
 * @param {Object} obj.
 * @return {Object}
 */
exports.freeze = function freeze(obj) {
    var key;

    if (obj instanceof Object) {
        for (key in obj) {
            freeze(obj[key]);
        }

        Object.freeze(obj);
    }
};
