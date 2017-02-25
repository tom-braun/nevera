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
                note.children('.noteText').text(labelChangedEvent.newLabel);
                this.noteVersions[aggId] = version;
            }
        } else if (type === EventType.noteDeleted) {
            if (version > this.noteVersions[aggId]) {
                const note = this.findNote(aggId);
                note.remove();
                this.noteVersions[aggId] = version;
            }
        }
    }

    protected onNoteCreated(event: NoteCreatedEvent, version : number) {
        console.log("onNoteCreated", event);
        console.log("onNoteCreated");
        const note = $(`<div id='${event.aggId}' class='${ event.noteType } draggable' version='${version}'></div>`);
        const delButton = $(`<span class="delete-button">x</span>`);
        const noteText = $(`<div class='noteText'/>`)

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

        noteText.on('click', event => {
            console.log("noteText.click");
            noteText.attr('contenteditable', "true");
            noteText.focus();
        });

        noteText.on('dblclick', event => {
            noteText.attr('contenteditable', "true");
            noteText.select();
            noteText.focus();
        });

        let oldText = "";
        noteText.on("focus",
            (e) => {
                oldText = note.text();
                console.log("focus: ", oldText);
            }
        );
        noteText.on("blur",
            (e) => {
                console.log("blur: ", oldText);
                var newText = noteText.text()
                if (newText != oldText) {
                    noteText.text(oldText);
                    this.bus.postNoteLabelChanged(event.aggId, newText)
                }
            }
        );

        delButton.click(e => {
            this.bus.postNoteDeleted(event.aggId);
            console.log("DELETE");
        });

        note.append(delButton);
        note.append(noteText);
        $(this.canvas).append(note);
        note.focus();
    }
}