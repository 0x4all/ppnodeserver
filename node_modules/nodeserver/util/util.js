var util = {};
module.exports = util;

util.foreachhandler = function(arr, req, errhandler) {
    if(!(arr instanceof Array)) {
        throw new Error("arr is not Array");
        return;
    }
    if(!(errhandler && typeof errhandler == "function")) {
        throw new Error("errhandler is not function");
        return;
    }
    var i = 0;
    var n = arr.length;
    var next = function(err) {
        if(err) {
            errhandler(err);
            return;
        }
        if(i < n) {
            var handler = arr[i++];
            if(!!handler && typeof handler === "function") {
                handler(req, next);
            }
            else {
                console.warn("array index:",i-1," is not function. ignored.")
            }
        }
        else if(i == n){
            errhandler(null, req);
            return;
        }
    }
    next();
}

/**
 * 1.执行 next(),后续handler继续执行
 * 2.执行 next(err),后续不再执行，就进入 errhandler
 * 3.只要不执行next，后续也不再执行
 */