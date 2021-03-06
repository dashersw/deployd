var resources = require('./collections/resources');
var collection = require('./types/collection');

function flipArgs(func) {
  return function(err, result) {
    func(result, err);
  }
}

module.exports = {
  createLib: function(allowWrite, callback) {
    if (!callback) {
      allowWrite = true;
      callback = arguments[0];
    }

    resources.get(function(err, resources) {
      if (err) { return callback(null, err); }

      var lib = {};

      resources.forEach(function(r) {
        if(~r.type.indexOf('Collection')) {
          var resource = collection.use(r.path);
          var api = lib[r.path.replace('/', '')] = {
            get: function(query, fn) {
              if (!fn) {
                fn = arguments[0];
                query = {};
              }

              resource.get(query, flipArgs(fn));
            }
            , getOne: function(query, fn) {
              if (!fn) {
                fn = arguments[0];
                query = {};
              }

              resource.get(query).first(flipArgs(fn));
            }
          };

          api.first = api.getOne;

          if (allowWrite) {
            api.post = function(obj, fn) {
              resource.post(obj, flipArgs(fn));
            };

            api.put = function(id, obj, fn) {
              if (typeof id !== 'string') { 
                obj = arguments[0]; //reorder parameters 
                fn = arguments[1]; 
                id = obj && obj._id;
              }
              
              resource.get({_id: id}).put({_id: id}, obj, flipArgs(fn));
            };

            api.del = function(id, fn) {
              resource.del({_id: id}, flipArgs(fn));
            };
          }

          if(r.type === 'UserCollection') {
            api.me = function(fn) {
              resource.use('/me').get(flipArgs(fn));
            }
          }
        }
      });
  
      callback(lib);
    });
  }
}