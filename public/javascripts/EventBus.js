///<reference path="../../node_modules/@types/ws/index.d.ts"/>
/**
 * Created by tom on 11.02.17.
 */
var EventType = (function () {
    function EventType() {
    }
    EventType.noteCreated = "noteCreated";
    EventType.noteMoved = "noteMoved";
    EventType.noteLabelChanged = "noteLabelChanged";
    return EventType;
}());
var NoteCreatedEvent = (function () {
    function NoteCreatedEvent(aggId, noteType, x, y) {
        this.aggId = aggId;
        this.noteType = noteType;
        this.x = x;
        this.y = y;
        this.type = EventType.noteCreated;
    }
    return NoteCreatedEvent;
}());
var NoteLabelChangedEvent = (function () {
    function NoteLabelChangedEvent(aggId, newLabel) {
        this.aggId = aggId;
        this.newLabel = newLabel;
        this.type = EventType.noteLabelChanged;
    }
    return NoteLabelChangedEvent;
}());
var NoteMovedEvent = (function () {
    function NoteMovedEvent(aggId, x, y) {
        this.aggId = aggId;
        this.x = x;
        this.y = y;
        this.type = EventType.noteMoved;
    }
    return NoteMovedEvent;
}());
var EventBus = (function () {
    function EventBus(url) {
        var _this = this;
        this.url = url;
        this.listeners = [];
        this.socket = new WebSocket(url);
        this.socket.onopen = function () {
            console.log("EventBus onOpen");
            _this.socket.send(JSON.stringify({ 'action': 'subscribeForAll' }));
        };
        this.socket.onmessage = function (msg) {
            console.log("EventBus received msg:", msg);
            var storeEvent = JSON.parse(msg.data);
            _this.notifyListeners(storeEvent.type, storeEvent.aggId, storeEvent.version, storeEvent.data);
        };
        this.socket.onerror = function (err) {
            console.log("EventBus error:", err);
        };
    }
    EventBus.prototype.postNoteCreated = function (aggId, noteType, x, y) {
        var event = new NoteCreatedEvent(aggId, noteType, x, y);
        this.postEvent(aggId, event, 0);
        return event;
    };
    EventBus.prototype.postNoteLabelChanged = function (aggId, newLabel) {
        var event = new NoteLabelChangedEvent(aggId, newLabel);
        this.postEvent(aggId, event, 0);
    };
    EventBus.prototype.postNoteMoved = function (aggId, x, y) {
        var event = new NoteMovedEvent(aggId, x, y);
        this.postEvent(aggId, event, 0);
    };
    EventBus.prototype.registerListener = function (aListener) {
        this.listeners.push(aListener);
    };
    EventBus.prototype.postEvent = function (aggId, event, version) {
        console.log("EventBus postEvent", event);
        this.socket.send(JSON.stringify({
            action: 'appendEvent',
            type: event.type,
            aggId: aggId,
            data: event,
            version: version
        }));
    };
    EventBus.prototype.notifyListeners = function (type, aggId, version, event) {
        this.listeners.forEach(function (listener) {
            listener.onEvent(type, aggId, version, event);
        });
    };
    return EventBus;
}());
//# sourceMappingURL=EventBus.js.map