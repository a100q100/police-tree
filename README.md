**Feature**

 - police-tree extend [sails policies](http://sailsjs.org/#!/documentation/concepts/Policies) when use blueprint rest

 - Sometimes, when we create apis with sails generator, the models may
   have Associations between them, and we don't want to expose all
   blueprint rest apis, so police-tree allow you create verify rule by
   only one root controller

**Usage**

 First create the tree config like below:

```javascript
treeConfig = {
  /* checkPoint is the point of the current root resource, when path like: /company/1/team/2
   * mean:
   * 1. match any method
   * 2. id == 1
   * 3. cb(false) return verify fail, cb(true) this point verify pass and goto endPoint verify
   */
  checkPoint : { 
    "*": function (req, res, id, cb) {
      .... // some code
      if(!verifyIdPermittedByCurrentLoginUser(id))
        cb(false); // return false when verify fail
    }
  },
 
  /* endPoint is the point of the end resource, match when path like : /team/2, but not match when path like : /team/2/project/3
   * mean:
   * 1. match only get method
   * 2. id == 2
   * 3. cb(false) return verify fail, cb(true) this point verify pass
   */
  endPoint : {
    "get" :function (req, res, id, cb) {
      endPoint = true;
      cb(true); // return true when verify success
    }
  },
  
  /* any end point in the path,  when path like:/projects/1/todos/99/users/10
   * mean:
   * 1. end resource "users" and match only post method
   * 2. id == 10
   * 3. cb(false) return verify fail, cb(true) this point verify pass and goto nextLeaf that have defined
   */
  anyEndPoint : { 
      "users" :{
        "post" : function(req, res, id, cb){
              return false;
            }
        }
    },
    nextLeaf : {
        // treeConfig of next leaf path, 
        // if the path is /company/1/team/2/project/3, 
        // then next path is /team/2/project/3 
        // and nextLeaf is corresponding config
    }
}
```
 then in the police file in the sails policies folder, call police-tree pass the config:

```javascript
module.exports = function(req, res, next) {
  require("police-tree")(req, res, next, configTree);
}
```

 when return false in the ponit of config tree, there will return 403 by use res.forbidden and return the message:

    forbidden by police tree with xxxPoint

 run test cases

    mocha
