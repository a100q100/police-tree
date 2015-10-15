/**
 * @license
 * police-tree
 * extend Sails policies http://sailsjs.org/#!/documentation/concepts/Policies
 * Copyright 2012-2015 7372@163.com
 * Available under MIT license
 */
var q = require("q");
var _ = require("lodash");
/**
 * get promise for cb
 * @param cb
 * @returns {Function}
 */
function getPromise(cb) {
	return function (req, res, id) {
		var defer = q.defer();
		cb(req, res, id, function (result) {
			result = result !== false;
			defer.resolve(result);
		});
		return defer.promise;
	}
}
/**
 * match the tree config by the point passed
 * @param point
 * @param method
 * @returns {Function}
 */
function matchMethod(point, method) {
	var results = [];
	if("*" in point){
		results.push(getPromise(point["*"]));
	}
	_.forIn(point, function (v, k) {
		if(k.indexOf(method) > -1){
			results.push(getPromise(v));
		}
	});
	if(results.length == 0) return null;
	return function (req, res, id, cb) {
		var promises = [];
		_.forIn(results, function (v) {
			promises.push(v(req, res, id, cb));
		});
		q.all(promises).then(function (finalResults) {
			var result = true;
			_.forIn(finalResults, function (v) {
				result = result && v;
			});
			cb(result);
		})
	}
}
/**
 * get the id of controller
 * @param path
 * @returns {boolean|string}
 */
function getId(path){
	return /^\/(deep\/)?([^\/]+)\/([^\/]+)\/?/gi.test(path) &&  RegExp.$3;
}
/**
 * remove the "/"s in the end of the path
 * @param path
 * @returns {XML|string|void|*}
 */
function trimDivide(path){
	return path.replace(/\/*$/gi, "");
}
/**
 * path is optional
 * @param req
 * @param res
 * @param next
 * @param tree
 * @param path
 */
module.exports = function (req, res, next, tree, path) {
	var callee = arguments.callee;
	var args = arguments;
	var path = trimDivide(path || req.path);
	var method = req.method.toLowerCase();
	var id = getId(path);
	var isEndPoint =  /^\/(deep\/)?([^\/]+)\/?(([^\/]+)\/?)?$/gi.test(path);
	var checkPoint = function () {
		var defer = q.defer();
		var result = true;
		if(tree.checkPoint){
			var check = matchMethod(tree.checkPoint, method);
			if(check){
				check(req, res, id, function (result) {
					defer.resolve(result !== false);
				});
				return defer.promise;
			}
		}
		defer.resolve(result);
		return defer.promise;
	};

	var endPoint = function () {
		var defer = q.defer();
		var result = true;

		if(tree.endPoint
			&& /\/(deep\/)?[^\/]+\/[^\/]+\/([^\/]+)\/?(([^\/]+)\/?)?$/gi.test(path)){
			var leaf = RegExp.$2;
			var leafId = RegExp.$4;
			if (tree.endPoint[leaf]) {
				var check = matchMethod(tree.endPoint[leaf], method);
				if(check){
					check(req, res, leafId, function (result) {
						defer.resolve(result !== false);
					});
					return defer.promise;
				}
			}
		}
		defer.resolve(result);
		return defer.promise;
	};
	var nextLeaf = function () {
		if(!isEndPoint && tree.nextLeaf){
			callee.apply(this, (_a = Array.prototype.slice.call(args, 0, 3))
			&& _a.concat([tree.nextLeaf, /\/(deep\/)?[^\/]+\/[^\/]+(\/.*)$/gi.test(path) && RegExp.$2]));
		}else{
			next();
		}
	};
	// if response forbidden, you can check the forbidden message below to get the block point
	checkPoint().then(function (resultFromCheckPoint) {
		if(resultFromCheckPoint){
			endPoint().then(function (resultFromEndPoint) {
				if(resultFromEndPoint){
					nextLeaf();
				}else{
					res.forbidden("forbidden by police tree with endPoint")
				}
			})
		}else{
			res.forbidden("forbidden by police tree with checkPoint")
		}
	})

}
/**
 * get the end model controller, but not the root tree controller
 * @param req
 * @returns {boolean|{model: string, id: string}}
 */
module.exports.getEndModel = function (req) {
	var path = req.path;
	path = trimDivide(path);
	return /(\/[^\/]+\/[^\/]+){1,}\/([^\/]+)\/?([^\/]+)?$/gi.test(path)
		&& {
			model : RegExp.$2,
			id : RegExp.$3
		}
}
module.exports.getId = getId;
module.exports.trimDivide = trimDivide;
