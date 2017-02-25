///<reference path="EventBus.ts"/>
///<reference path="StyleChooser.ts"/>
///<reference path="../../node_modules/@types/jquery/index.d.ts"/>
///<reference path="../../node_modules/@types/jqueryui/index.d.ts"/>
/**
 * Created by tom on 11.02.17.
 */
var ESBoard = (function () {
    function ESBoard(canvasId, bus, styles) {
        var _this = this;
        this.canvasId = canvasId;
        this.bus = bus;
        this.styles = styles;
        this.noteVersions = {};
        this.canvas = canvasId;
        this.eventBus = bus;
        this.styleChooser = styles;
        $(this.canvas).on("click", function (e) {
            if (e.ctrlKey) {
                _this.bus.postNoteCreated(ESBoard.uuid(), _this.styleChooser.getSelectedStyle(), e.pageX, e.pageY);
            }
        });
        this.eventBus.registerListener(this);
        console.log("ESBoard created");
    }
    ESBoard.uuid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    ESBoard.prototype.findNote = function (aggId) {
        return $("#" + aggId);
    };
    ESBoard.prototype.onEvent = function (type, aggId, version, event) {
        console.log("ESBoard.onEvent:", event);
        if (type === EventType.noteCreated) {
            console.log("onEvent: noteCreated");
            this.onNoteCreated(event, version);
            this.noteVersions[aggId] = version;
        }
        else if (type === EventType.noteMoved) {
            var note = this.findNote(aggId);
            var movedEvent = event;
            if (version > this.noteVersions[aggId]) {
                this.noteVersions[aggId] = version;
                note.css({ left: movedEvent.x, top: movedEvent.y, position: 'absolute' });
                this.noteVersions[aggId] = version;
            }
        }
        else if (type === EventType.noteLabelChanged) {
            if (version > this.noteVersions[aggId]) {
                var note = this.findNote(aggId);
                var labelChangedEvent = event;
                note.text(labelChangedEvent.newLabel);
                this.noteVersions[aggId] = version;
            }
        }
    };
    ESBoard.prototype.onNoteCreated = function (event, version) {
        var _this = this;
        console.log("onNoteCreated", event);
        console.log("onNoteCreated");
        var note = $("<div id='" + event.aggId + "' class='" + event.noteType + " draggable' version='" + version + "'></div>");
        note.draggable({
            containment: this.canvas, scroll: true,
            start: function () {
                var pos = note.position();
                console.log("started dragging: " + pos.left + ", " + pos.top);
            },
            drag: function () {
                var pos = note.position();
                //console.log("dragging: " + pos.left + ", " + pos.top);
            },
            stop: function () {
                var pos = note.position();
                console.log("stopped dragging: " + pos.left + ", " + pos.top);
                _this.bus.postNoteMoved(event.aggId, pos.left, pos.top);
            }
        });
        note.css({ left: event.x, top: event.y, position: 'absolute' });
        note.attr("contenteditable", "true");
        var oldText = "";
        note.on("focus", function (e) {
            oldText = note.text();
            console.log("focus: ", oldText);
        });
        note.on("blur", function (e) {
            console.log("blur: ", oldText);
            var newText = note.text();
            if (newText != oldText) {
                console.log("text changed: " + oldText + " -> " + $(_this).text());
                note.text(oldText);
                _this.bus.postNoteLabelChanged(event.aggId, newText);
            }
        });
        $(this.canvas).append(note);
        note.focus();
    };
    return ESBoard;
}());
//# sourceMappingURL=ESBoard.js.map