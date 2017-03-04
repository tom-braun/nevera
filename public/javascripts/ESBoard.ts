///<reference path="EventBus.ts"/>
///<reference path="StyleChooser.ts"/>
///<reference path="../../node_modules/@types/jquery/index.d.ts"/>
///<reference path="../../node_modules/@types/jqueryui/index.d.ts"/>
/**
 * Created by tom on 11.02.17.
 */

function findNote(aggId: string) {
    return $(`#${aggId}`);
}

class ESBoard implements NoteEventListener {
    readonly canvas: string;
    readonly eventBus: EventBus
    readonly styleChooser: StyleChooser;
    noteVersions: {[id: string]: number} = {};

    static uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    constructor(public canvasId: string, private bus: EventBus, private styles: StyleChooser) {
        this.canvas = canvasId;
        this.eventBus = bus;
        this.styleChooser = styles;

        $(this.canvas).on("click", (e: JQueryMouseEventObject) => {
                if (e.ctrlKey) {
                    const x = e.offsetX;
                    const y = e.offsetY;
                    this.bus.postNoteCreated(ESBoard.uuid(), this.styleChooser.getSelectedStyle(), x, y);
                }
            }
        );

        this.setupNameEditing($("#boardName"));


        this.eventBus.registerListener(this);
    }

    private setupNameEditing($boardName: JQuery) {
        $boardName.blur(() => {
            jQuery.ajax({
                url: location.href + "/name/" + $boardName.text(),
                type: "PUT"
            });
        });
    }


    public onEvent(type: string, aggId: string, version: number, event: NoteEvent) {
        console.log("ESBoard.onEvent:", event);
        if (type === EventType.noteCreated) {
            this.onNoteCreated(event as NoteCreatedEvent);
            this.noteVersions[aggId] = version;
        } else if (type === EventType.noteMoved) {
            const note = findNote(aggId);
            const movedEvent = event as NoteMovedEvent;
            if (version > this.noteVersions[aggId]) {
                this.noteVersions[aggId] = version;
                note.css({left: movedEvent.x, top: movedEvent.y, position: 'absolute'});
                this.noteVersions[aggId] = version;
            }
        } else if (type === EventType.noteLabelChanged) {
            if (version > this.noteVersions[aggId]) {
                const note = findNote(aggId);
                const labelChangedEvent = event as NoteLabelChangedEvent;
                const noteText = note.children('.note-text');
                console.log("noteLabelChanged:", note.index(), labelChangedEvent.newLabel)
                noteText.text(labelChangedEvent.newLabel);

                this.noteVersions[aggId] = version;
            }
        } else if (type === EventType.noteDeleted) {
            if (version > this.noteVersions[aggId]) {
                const note = findNote(aggId);
                note.remove();
                this.noteVersions[aggId] = version;
            }
        }
    }

    protected onNoteCreated(event: NoteCreatedEvent) {
        const note = $(`<div id='${event.aggId}' class='note ${ event.noteType } draggable'></div>`);
        const delButton = $(`<span class="delete-button">x</span>`);
        const noteText = $(`<div class='note-text'/>`);

        note.draggable({
            containment: this.canvas, scroll: true,
            start: () => {
                const pos = note.position();
                note.addClass("moving");
            },
            drag: () => {
                // const pos = note.position();
                //console.log("dragging: " + pos.left + ", " + pos.top);
            },
            stop: () => {
                const pos = note.position();
                note.removeClass("moving");
                this.bus.postNoteMoved(event.aggId, pos.left, pos.top)
            }
        });

        note.css({left: event.x, top: event.y, position: 'absolute'});

        noteText.on('click', () => {
            noteText.attr('contenteditable', "true");
            noteText.focus();
        });

        let oldText = undefined;
        noteText.on("focus",
            () => {
                oldText = note.text();
                console.log("focus: ", oldText);
            }
        );
        noteText.on("blur",
            () => {
                console.log("blur: ", oldText);
                let newText = noteText.text();
                if (oldText != undefined && newText != oldText) {
                    noteText.text(oldText);
                    console.log("postNoteLabelChanged:", note.index(), newText);
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

        noteText.attr('contenteditable', "true");

        // FIXME: if we enable this, replay will cause posts occasionally
        // also: node will take focus on other clients
        // solution: we need to check whether the event originated from this session.
        // noteText.focus();
    }
}