/**
 * Created by harry on 15/5/14.
 */
var assert = require("assert");
var policeTree = require("../index");
var treeConfig = null;
describe('policeTree', function(){
  it('checkPoint case', function(done){
    var call = function (msg) {
      assert.equal(msg, "forbidden");
      assert.equal(checkPointCall, true);
      done();
    };
    var checkPointCall = false;
    treeConfig = {
      checkPoint : {
        "*": function (req, res, id, cb) {
          checkPointCall = true;
          cb(false);
        }
      }
    }
    policeTree({
      method : "post",
      path : "/company"
    },{
      forbidden : function(err){
        call("forbidden");
      }
    },function () {
      call("next");
    }, treeConfig);
  });

  it('multi check case 1', function(done){
    var call = function (msg) {
      assert.equal(msg, "forbidden");
      assert.equal(checkPointCallAll, true);
      assert.equal(checkPointCallPost, true);
      done();
    };
    var checkPointCallAll = false;
    var checkPointCallPost = false;
    treeConfig = {
      checkPoint : {
        "*": function (req, res, id, cb) {
          checkPointCallAll = true;
          cb(false);
        },
        "post": function (req, res, id, cb) {
          checkPointCallPost = true;
          cb(true);
        }
      }
    }
    policeTree({
      method : "post",
      path : "/company"
    },{
      forbidden : function(err){
        call("forbidden");
      }
    },function () {
      call("next");
    }, treeConfig);
  });

  it('multi check case 2', function(done){
    var call = function (msg) {
      assert.equal(msg, "forbidden");
      assert.equal(checkPointCallGet, true);
      assert.equal(checkPointCallPostGet, true);
      done();
    };
    var checkPointCallGet = false;
    var checkPointCallPostGet = false;
    treeConfig = {
      checkPoint : {
        "get": function (req, res, id, cb) {
          checkPointCallGet = true;
          cb(false);
        },
        "post get": function (req, res, id, cb) {
          checkPointCallPostGet = true;
          cb(true);
        }
      }
    }
    policeTree({
      method : "get",
      path : "/company"
    },{
      forbidden : function(err){
        call("forbidden");
      }
    },function () {
      call("next");
    }, treeConfig);
  });


  it('endPoint case', function(done){
    var call = function (msg) {
      assert.equal(msg, "next");
      assert.equal(checkPointCall, false);
      assert.equal(endPoint, false);
      assert.equal(comments, true);
      assert.equal(attachments, false);
      assert.equal(commentId, "888");
      done();
    };
    var checkPointCall = false;
    var endPoint = false;
    var comments = false;
    var attachments = false;
    var commentId = false;
    treeConfig = {
      checkPoint : {
        "post get": function (req, res, id, cb) {
          checkPointCall = true;
          cb(true);
        }
      },
      endPoint : {
         comments : {
           "put" : function (req, res, id, cb) {
             commentId = id;
             comments = true;
             cb(true);
           }
         },
        attachments : {
           "put" : function (req, res, id, cb) {
             attachments = true;
             cb(true);
           }
         }
      }
    }
    policeTree({
      method : "put",
      path : "/company/company_id/projects/1/attachments/9999/comments/888"
    },{
      forbidden : function(err){
        call("forbidden");
      }
    },function () {
      call("next");
    }, treeConfig);
  })

  it('nextLeaf case', function(done){
    var call = function (msg) {
      assert.equal(msg, "next");
      assert.equal(checkPointCall, true);
      assert.equal(endPoint, false);
      assert.equal(nextLeaf_checkPointCall, true);
      assert.equal(comments, false);
      assert.equal(attachments, false);
      assert.equal(commentId, false);
      assert.equal(projectId, "1");
      done();
    };
    var checkPointCall = false;
    var endPoint = false;
    var nextLeaf_checkPointCall = false;
    var comments = false;
    var attachments = false;
    var commentId = false;
    var projectId = false;
    treeConfig = {
      checkPoint : {
        "post get": function (req, res, id, cb) {
          checkPointCall = true;
          cb(true);
        }
      },
      endPoint : {
        comments : {
          "put" : function (req, res, id, cb) {
            commentId = id;
            comments = true;
            cb(true);
          }
        },
        attachments : {
          "put" : function (req, res, id, cb) {
            attachments = true;
            cb(true);
          }
        }
      },
      nextLeaf : {
        checkPoint : {
          "get": function (req, res, id, cb) {
            nextLeaf_checkPointCall = true;
            projectId = id;
            cb(true);
          }
        }
      }
    }
    policeTree({
      method : "get",
      path : "/company/company_id/projects/1/attachments/9999/comments/888"
    },{
      forbidden : function(err){
        call("forbidden");
      }
    },function () {
      call("next");
    }, treeConfig);
  })
  it('getEndModel', function(done) {
    var endModel = policeTree.getEndModel({
      path : "/company/company_id/projects/1/attachments/9999/comments/888"
    });
    assert.equal(endModel.model, "comments");
    assert.equal(endModel.id, "888");

    endModel = policeTree.getEndModel({
      path : "/company/company_id/projects"
    });
    assert.equal(endModel.model, "projects");
    assert.equal(!!endModel.id, false);

    endModel = policeTree.getEndModel({
      path : "/company/company_id/projects/"
    });
    assert.equal(endModel.model, "projects");
    assert.equal(!!endModel.id, false);

    endModel = policeTree.getEndModel({
      path : "/company/company_id/projects/1"
    });
    assert.equal(endModel.model, "projects");
    assert.equal(!!endModel.id, "1");
    done();
  });
  it('trimDivide', function(done) {
    var expect = "/company/company_id/projects/1";
    assert.equal(policeTree.trimDivide("/company/company_id/projects/1"), expect);
    assert.equal(policeTree.trimDivide("/company/company_id/projects/1/"), expect);
    assert.equal(policeTree.trimDivide("/company/company_id/projects/1////"), expect);
    done();
  });
})
