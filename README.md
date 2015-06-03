**Feature**

 - police-tree extend [sails policies](http://sailsjs.org/#!/documentation/concepts/Policies) when use blueprint rest

 - Sometimes, when we create apis with sails generator, the models may
   have Associations between them, and we don't want to expose all
   blueprint rest apis, so police-tree allow you create verify rule by
   only one root controller

**Usage**

 First create the tree config like below:

    treeConfig = {
      checkPoint : { // checkPoint is the point of current root path
        "*": function (req, res, id, cb) {
          .... // some code
          if(!verifyIdPermittedByCurrentLoginUser(id))
            cb(false); // return false when verify fail
        }
      },
      endPoint : {// endPoint is the ponit of the end path and also root point
        "get" :function (req, res, id, cb) {
          endPoint = true;
          cb(true); // return true when verify success
        }
      },
      anyEndPoint : { // any end point in the path such as:/projects/1/todos/99/users/10
	      "users" :{
			"post" : function(){
				  return false;
				}
			}
		},
		nextLeaf : {
			... // next config of next path
		}
    }

 then in the police file in the sails policies folder, call police-tree pass the config:

	module.exports = function(req, res, next) {
	  require("police-tree")(req, res, next, configTree);
	}

 when return false in the ponit of config tree, there will return 403 by use res.forbidden and return the message:

    forbidden by police tree with xxxPoint

 run test cases

    mocha
