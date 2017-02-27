var express = require('express');
var router = express.Router();

var stores = {};


var _nid = 1;
function nextId() {
    var id = _nid;
    _nid = _nid + 1;
    return id;
}

router.get(':id', function(req, res) {
    var storeId = req.params.id;
    var store = stores[storeId];

    if (store === undefined) {
        res.status(404).send('No such store!');
    } else {
        res.json(store);
    }
});

router.post('/', function(req, res) {
    var storeId = nextId();
    stores[storeId] = JSON.parse(req.body);

    var json = {};
    json["storeId"] = storeId;
    res.json(json);
});

router.post('/:id', function(req, res) {
    var storeId = req.params.id;
    var store = stores[storeId];

    var event = JSON.parse(req.body);

    store['events'].push(event);
});

module.exports = router;
