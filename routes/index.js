var express = require('express');
var router = express.Router();

var process_tweets= require('../app/controllers/main');

router.get('/process', process_tweets);

module.exports = router;
