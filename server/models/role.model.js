'use strict';

const _ = require('lodash');
const Config = require('../../config');

const USER_ROLES = Config.get('/constants/USER_ROLES');

module.exports = function (mongoose) {
  var modelName = "role";
  var Types = mongoose.Schema.Types;
  var Schema = new mongoose.Schema({
    name: {
      type: Types.String,
      enum: _.values(USER_ROLES),
      required: true
    },
    description: {
      type: Types.String
    }
  }, { collection: modelName });
    
  Schema.statics = {
    collectionName:modelName,
    routeOptions: {
      associations: {
        users: {
          type: "ONE_MANY",
          alias: "user",
          foreignField: "role",
          model: "user"
        },
        permissions: {
          type: "MANY_MANY",
          alias: "permission",
          model: "permission",
          linkingModel: "role_permission"
        }
      }
    }
  };

  return Schema;
};