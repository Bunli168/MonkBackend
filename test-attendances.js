const { User } = require('./models');
const request = require('supertest');
const app = require('./app'); // If app exports express, but maybe it just starts the server. Let's just make a curl request!

