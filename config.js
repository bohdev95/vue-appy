'use strict';

const Confidence = require('confidence');
const Dotenv = require('dotenv');

Dotenv.config({ silent: true });

const criteria = {
  env: process.env.NODE_ENV
};

const constants = {
  USER_ROLES: {
    USER: 'User',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin',
  },
  PERMISSION_STATES: {
    INCLUDED: 'Included',
    EXCLUDED: 'Excluded',
    FORBIDDEN: 'Forbidden',
  },
  AUTH_STRATEGIES: {
    TOKEN: 'standard-jwt',
    SESSION: 'jwt-with-session',
    REFRESH: 'jwt-with-session-and-refresh-token'
  },
  REQUIRED_PASSWORD_STRENGTH: {
    USER: 3,
    ADMIN: 4,
    SUPER_ADMIN: 4,
  },
  PORT: 8125,
  APP_TITLE: 'appy API'
};

const config = {
  $meta: 'This file configures the appy API.',
  projectName: constants.APP_TITLE,
  websiteName: 'appy Admin',
  port: {
    $filter: 'env',
    production: process.env.PORT,
    $default: constants.PORT
  },
  constants: constants,
  expirationPeriod: {
    short: '10m',
    medium: '4h',
    long: '730h'
  },
  authAttempts: {
    forIp: 50,
    forIpAndUser: 5
  },
  lockOutPeriod: 30, //in units of minutes
  jwtSecret: {
    $filter: 'env',
    production: process.env.JWT_SECRET,
    $default: 'aStrongJwtSecret-#mgtfYK@QuRV8VMM7T>WfN4;^fMVr)y'
  },
  socialPassword: {
    $filter: 'env',
    production: process.env.SOCIAL_PASSWORD,
    $default: 'aStrongJwtSecret-#mgtfYK@QuRV8VMM7T>WfN4;^fMVr)y'
  },
  socialIds: {
    $filter: 'env',
    production: {
      facebook: process.env.FACEBOOK_ID,
    },
    $default: {
      facebook: process.env.FACEBOOK_ID,
    }
  },
  socialSecrets: {
    $filter: 'env',
    production: {
      facebook: process.env.FACEBOOK_SECRET,
    },
    $default: {
      facebook: process.env.FACEBOOK_SECRET,
    }
  },
  nodemailer: {
    $filter: 'env',
    local: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'appyhapi@gmail.com',
        pass: process.env.SMTP_PASSWORD
      }
    },
    production: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'appyhapi@gmail.com',
        pass: process.env.SMTP_PASSWORD
      }
    }
  },
  /**
   * defaultEmail:
   * If set to null, outgoing emails are sent to their actual address,
   * otherwise outgoing emails are sent to the defaultEmail
   */
  defaultEmail: {
    $filter: 'env',
    local: 'appyhapi@gmail.com',
    development: 'appyhapi@gmail.com',
    production: 'appyhapi@gmail.com'
  },
  system: {
    fromAddress: {
      name: 'appy',
      address: 'appyhapi@gmail.com'
    },
    toAddress: {
      name: 'appy',
      address: 'appyhapi@gmail.com'
    }
  },
  clientURL: {
    $filter: 'env',
    local: 'http://localhost:8080',
    production: process.env.CLIENT_URI,
    $default: 'http://localhost:8080'
  },
  restHapiConfig: {
    appTitle: constants.APP_TITLE,
    mongo: {
      URI: {
        $filter: 'env',
        local: 'mongodb://localhost:27017/appy',
        production: process.env.MONGODB_URI,
        $default: 'mongodb://localhost:27017/appy',
      }
    },
    cors: {
      additionalHeaders: ['X-Access-Token', 'X-Refresh-Token'],
      additionalExposedHeaders: ['X-Access-Token', 'X-Refresh-Token']
    },
    absoluteModelPath: true,
    modelPath: __dirname + '/server/models',
    absoluteApiPath: true,
    apiPath: __dirname + '/server/api',
      absolutePolicyPath: true,
      policyPath: __dirname + '/server/policies',
    authStrategy: {
      $filter: 'env',
      local: constants.AUTH_STRATEGIES.REFRESH,
      $default: constants.AUTH_STRATEGIES.REFRESH
    },
    enableQueryValidation: {
      $filter: 'env',
      local: true,
      $default: true
    },
    enablePayloadValidation: {
      $filter: 'env',
      local: true,
      $default: true
    },
    enableResponseValidation: {
      $filter: 'env',
      local: true,
      $default: true
    },
    enableTextSearch: {
      $filter: 'env',
      local: true,
      $default: true
    },
    enableSoftDelete: {
      $filter: 'env',
      local: true,
      $default: true
    },
    enablePolicies: {
        $filter: 'env',
        local: true,
        $default: true
    },
    enableDuplicateFields: {
        $filter: 'env',
        local: true,
        $default: true
    },
    trackDuplicatedFields: {
        $filter: 'env',
        local: true,
        $default: true
    },
    enableDocumentScopes: {
        $filter: 'env',
        local: true,
        $default: true
    },
    authorizeDocumentCreator: {
        $filter: 'env',
        local: true,
        $default: true
    },
    generateScopes: {
      $filter: 'env',
      local: true,
      $default: true
    },
    logRoutes: {
      $filter: 'env',
      local: true,
      $default: true
    },
    logScopes: {
      $filter: 'env',
      local: true,
      $default: true
    },
    loglevel: {
      $filter: 'env',
      local: "DEBUG",
      $default: "ERROR"
    }

  }
};


const store = new Confidence.Store(config);


exports.get = function (key) {

  return store.get(key, criteria);
};


exports.meta = function (key) {

  return store.meta(key, criteria);
};
