///<reference path="EventBus.ts"/>
///<reference path="StyleChooser.ts"/>
///<reference path="../../node_modules/@types/jquery/index.d.ts"/>
///<reference path="../../node_modules/@types/jqueryui/index.d.ts"/>
/**
 * Created by tom on 11.02.17.
 */

interface Note {
    version : number;
}

class ESBoard implements NoteEventListener {
    readonly canvas: string
    readonly eventBus : EventBus
    readonly styleChooser : StyleChooser;
    noteVersions : { [id : string] : number} = {};

    static uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

    constructor(public canvasId : string, private bus: EventBus, private styles : StyleChooser) {
        this.canvas = canvasId
        this.eventBus = bus
        this.styleChooser = styles;

        $(this.canvas).on("click", (e : JQueryMouseEventObject) => {
                if (e.ctrlKey) {
                    const x = e.offsetX;
                    const y = e.offsetY;
                    this.bus.postNoteCreated(ESBoard.uuid(), this.styleChooser.getSelectedStyle(), x,  y);
                }
            }
        );



        this.eventBus.registerListener(this)
        console.log("ESBoard created")
    }

    private findNote(aggId : string) {
        return $(`#${aggId}`);
    }

    public onEvent(type : string, aggId : string, version : number, event: NoteEvent) {
        console.log("ESBoard.onEvent:", event);
        if (type === EventType.noteCreated) {
            console.log("onEvent: noteCreated");
            this.onNoteCreated(event as NoteCreatedEvent, version);
            this.noteVersions[aggId] = version;
        } else if (type === EventType.noteMoved) {
            const note = this.findNote(aggId);
            const movedEvent = event as NoteMovedEvent;
            if (version > this.noteVersions[aggId]) {
                this.noteVersions[aggId] = version;
                note.css({left: movedEvent.x, top: movedEvent.y, position: 'absolute'});
                this.noteVersions[aggId] = version;
            }
        } else if (type === EventType.noteLabelChanged) {
            if (version > this.noteVersions[aggId]) {
                const note = this.findNote(aggId);
                const labelChangedEvent = event as NoteLabelChangedEvent;
                note.text(labelChangedEvent.newLabel);
                this.noteVersions[aggId] = version;
            }
        }
    }

    protected onNoteCreated(event: NoteCreatedEvent, version : number) {
        console.log("onNoteCreated", event);
        console.log("onNoteCreated");
        const note = $(`<div id='${event.aggId}' class='${ event.noteType } draggable' version='${version}'></div>`);

        note.draggable({
            containment: this.canvas, scroll: true,
            start: () => {
                const pos = note.position()
                console.log("started dragging: " + pos.left + ", " + pos.top);
            },
            drag: () => {
                const pos = note.position()
                //console.log("dragging: " + pos.left + ", " + pos.top);
            },
            stop: () => {
                const pos = note.position()
                console.log("stopped dragging: " + pos.left + ", " + pos.top);
                this.bus.postNoteMoved(event.aggId, pos.left, pos.top)
            }
        });

        note.css({left: event.x, top: event.y, position: 'absolute'});
        note.attr("contenteditable", "true");

        let oldText = "";
        note.on("focus",
            (e) => {
                oldText = note.text();
                console.log("focus: ", oldText);
            }
        );
        note.on("blur",
            (e) => {
                console.log("blur: ", oldText);
                var newText = note.text()
                if (newText != oldText) {
                    console.log("text changed: " + oldText + " -> " + $(this).text());
                    note.text(oldText);
                    this.bus.postNoteLabelChanged(event.aggId, newText)
                }
            }
        );

        $(this.canvas).append(note);
        note.focus();
    }
}