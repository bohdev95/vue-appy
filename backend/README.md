<p align="center"><a href="https://appyapp.io" target="_blank" rel="noopener noreferrer"><img width="262" height="295" src="https://user-images.githubusercontent.com/12631935/39099920-eaab3d3e-4636-11e8-9955-b53be05e1c13.png" alt="appy logo"></a></p>

## Features
 
* Registration and account activation flows
* Login system with forgot password and reset password
* Social login
* Abusive login attempt detection
* User permissions based on roles and groups
* Three optional authentication strategies
* Websocket chat via [@hapi/nes](https://github.com/hapijs/nes)
* File upload api
* Endpoint validation and query support
* Swagger docs for easy endpoint access

## Demos

View the swagger docs for the **live demo**:

https://api.appyapp.io

### Starting appy-backend

<p align="center"><a><img width="1024" height="480" src="https://user-images.githubusercontent.com/12631935/79036262-7f96bb00-7b7b-11ea-9fb0-bed77cc9d043.gif" alt="appy_start"></a></p>

### Logging in

<p align="center"><a><img width="1024" height="640" src="https://user-images.githubusercontent.com/12631935/79036503-a5bd5a80-7b7d-11ea-9964-737706a81467.gif" alt="appy_login"></a></p>

### GET /users

<p align="center"><a><img width="1024" height="640" src="https://user-images.githubusercontent.com/12631935/79036809-a0154400-7b80-11ea-9824-4670ad349b64.gif" alt="appy_get_users"></a></p>

### Filter Query and Populate Relationship

<p align="center"><a><img width="1024" height="640" src="https://user-images.githubusercontent.com/12631935/79037098-161aaa80-7b83-11ea-8fd5-5046e2d5fff7.gif" alt="appy_permissions_filter"></a></p>

## Readme contents
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [First time setup](#first-time-setup)
- [Running appy](#running-appy)
- [Wiki](#wiki)
- [Swagger documentation](#swagger-documentation)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [License](#license)
- [Questions](#questions)
- [Contributing](#contributing)
- [Thanks!](#thanks)


## Requirements

Just [Docker](https://docs.docker.com/install)

**OR**

You need [Node.js](https://nodejs.org/en/) installed (>=12.14.1) and you'll need [MongoDB](https://docs.mongodb.com/manual/installation/) installed and running.

[Back to top](#readme-contents)

## Installation

### Using Docker

None required.

### Without Docker

```bash
$ npm install
```

[Back to top](#readme-contents)

## Configuration
appy configuration follows [frame's](https://github.com/jedireza/frame) configuration flow:

> Simply edit ``config/index.js``. The configuration uses confidence which makes it easy to manage configuration settings across environments. Don't store secrets in this file or commit them to your repository.

> Instead, access secrets via environment variables. We use dotenv to help make setting local environment variables easy (not to be used in production).

### Using Docker
> Simply copy .env-docker-sample to .env-docker and edit as needed. Don't commit .env-docker to your repository.

### Without Docker
> Simply copy .env-sample to .env and edit as needed. Don't commit .env to your repository.

## First time setup
**WARNING**: This will clear all data in the MongoDB database defined in ``restHapiConfig.mongo.URI`` (default ``mongodb://localhost/appy``).

If you would like to seed your database with some data, run:

### Using Docker

```
$ sh seed_data.sh
```

### Without Docker

```
$ npm run seed
```

NOTE: The password for all seed users is ``root``.

[Back to top](#readme-contents)

## Running appy-backend

To quickly run the app locally, simply run:

## Using Docker

```
$ sh run_server.sh
```

## Without Docker

```
$ npm start
```

Once the app is running point your browser to http://localhost:8080/ to view the Swagger docs.

[Back to top](#readme-contents)


## Swagger documentation

Swagger documentation is automatically generated for all endpoints and can be viewed by pointing a browser at the server URL. By default this will be http://localhost:8080/. The swagger docs provide quick access to testing your endpoints along with model schema descriptions and query options.

[Back to top](#readme-contents)

## Authentication

There are three optional authentication strategies in appy and each make use of javascript web tokens (JWT) and the [hapi-auth-jwt2](https://www.npmjs.com/package/hapi-auth-jwt2) scheme.  The three strategies are:

1. Standard token
2. Session
3. Session with refresh token

The strategy used is determined by the ``restHapiConfig.authStrategy`` config property.


[Back to top](#readme-contents)

## Authorization

Authorization in appy is enforced via the hapi ``scope`` endpoint property.  Endpoints generated through [rest-hapi](https://github.com/JKHeadley/rest-hapi) come prepopulated with scope values. See the [rest-hapi docs](https://resthapi.com/docs/authorization.html) for more info.

User scope values are populated based on appy's permission system.  User's gain permissions based on three associations:

1. User defined permissions
2. Group defined permissions
3. Role defined permissions

Users must belong to at least one role and can belong to multiple groups.  Each permission association carries with it a ``state`` property that can be set to `Included`, `Excluded`, or `Forbidden`.  This property allows permissions to override each other based on priority.  User permissions have the highest priority, followed by Group permissions and lastly Role permissions:
```
User->Group->Role
```
This allows easy and specific configuration of user endpoint access.  In general, a user will gain the majority of it's permissions through it's role.  Those permissions will be further defined by any groups the user belongs to.  Finally a user might have a few specific permissions assigned directly to them.  A user's scope final scope is a combination of the user's role, groups, and effective permissions.  See below for an example:

User: ``'test@manager.com'``
Role: ``'Admin'``
Role Permissions: 

```javascript
[
  { name:'readUser', state:'Included' },
  { name:'updateUser', state:'Included' },
  { name:'addUserPermissions', state:'Included' },
  { name:'removeUserPermissions', state:'Included' }
]
```

User's Groups: ``['Managers']``
Group Permissions: 

```javascript
[
  { name:'updateUser', state:'Excluded' },
]
```

User Permissions: 

```javascript
[
  { name:'removeUserPermissions', state:'Excluded' },
]
```

Final User Scope:

```javascript
['Admin','Managers','readUser','addUserPermissions']
``` 

[Back to top](#readme-contents)

## License
MIT

[Back to top](#readme-contents)

## Thanks!
We hope you enjoy appy-backend!
