///<reference path="../../node_modules/@types/ws/index.d.ts"/>
/**
 * Created by tom on 11.02.17.
 */

class EventType {
    static noteCreated = "noteCreated";
    static noteMoved = "noteMoved";
    static noteLabelChanged = "noteLabelChanged";
    static noteDeleted = "noteDeleted";
}
interface NoteEvent {
    type;
}

class NoteCreatedEvent implements NoteEvent {
    readonly type = EventType.noteCreated;
    constructor(public aggId : string, public noteType : string, public x : number, public y : number) {}
}

class NoteLabelChangedEvent implements NoteEvent {
    readonly type = EventType.noteLabelChanged;
    constructor(public aggId: string, public newLabel: string) {}
}

class NoteMovedEvent implements NoteEvent {
    readonly type = EventType.noteMoved;
    constructor(public aggId: string, public x : number, public y : number) {}
}

class NoteDeletedEvent implements NoteEvent {
    readonly type = EventType.noteDeleted;
    constructor(public aggId: string) {}
}

interface NoteEventListener {
    onEvent(type : string, aggId : string, version : number, event: NoteEvent);
}



class EventBus {
    private listeners = []
    private socket : WebSocket;

    public constructor(private url : string) {
        this.socket = new WebSocket(url);
        this.socket.onopen = () => {
            console.log("EventBus onOpen");
            this.socket.send(JSON.stringify({'action' : 'subscribeForAll'}));
        };
        this.socket.onmessage = (msg: MessageEvent) => {
            console.log("EventBus received msg:", msg);
            const storeEvent = JSON.parse(msg.data);
            this.notifyListeners(storeEvent.type, storeEvent.aggId, storeEvent.version, storeEvent.data);
        };

        this.socket.onerror = (err: ErrorEvent) => {
            console.log("EventBus error:", err);
        };
    }

    public postNoteCreated(aggId : string, noteType : string, x : number, y : number) : NoteCreatedEvent {
        let event = new NoteCreatedEvent(aggId, noteType, x, y);
        this.postEvent(aggId, event, 0);
        return event
    }


    public postNoteLabelChanged(aggId: string, newLabel: string) {
        let event = new NoteLabelChangedEvent(aggId, newLabel);
        this.postEvent(aggId, event, 0);
    }

    public postNoteMoved(aggId: string, x : number, y : number) {
        let event = new NoteMovedEvent(aggId, x, y);
        this.postEvent(aggId, event, 0);
    }


    public postNoteDeleted(aggId: string) {
        let event = new NoteDeletedEvent(aggId);
        this.postEvent(aggId, event, 0);
    }

    registerListener(aListener : NoteEventListener) {
        this.listeners.push(aListener);
    }
    private postEvent(aggId: string, event : NoteEvent, version : number) {
        console.log("EventBus postEvent", event);
        this.socket.send(
            JSON.stringify({
                action: 'appendEvent',
                type: event.type,
                aggId : aggId,
                data: event,
                version: version
            })
        );
    }

    private notifyListeners(type : string, aggId : string, version : number, event: NoteEvent) {
        this.listeners.forEach( (listener) => {
            listener.onEvent(type, aggId, version, event)
        })
    }
}
