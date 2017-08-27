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

    constructor(public aggId: string, public noteType: string, public x: number, public y: number) {
    }
}

class NoteLabelChangedEvent implements NoteEvent {
    readonly type = EventType.noteLabelChanged;

    constructor(public aggId: string, public newLabel: string) {
    }
}

class NoteMovedEvent implements NoteEvent {
    readonly type = EventType.noteMoved;

    constructor(public aggId: string, public x: number, public y: number) {
    }
}

class NoteDeletedEvent implements NoteEvent {
    readonly type = EventType.noteDeleted;

    constructor(public aggId: string) {
    }
}

interface NoteEventListener {
    onEvent(fromSelf: boolean, type: string, aggId: string, version: number, event: NoteEvent);
}

interface ConnectionData {
    sessionId: string;
}


class EventBus {
    private listeners = []
    private socket: WebSocket;
    private sessionId: string;
    private cursor = -1;

    public constructor(private url: string) {
        this.openSocket(url);
    }

    private openSocket(url: string) {
        this.socket = new WebSocket(url);
        this.socket.onopen = () => {
            this.socket.send(JSON.stringify({'action': 'subscribeForAll', 'version' : this.cursor}));
        };
        this.socket.onmessage = (msg: MessageEvent) => {
            console.log("EventBus received msg:", msg);
            const storeEvent = JSON.parse(msg.data);
            if (storeEvent.version > this.cursor) {
                if (storeEvent.type === '_sessionInfo') {
                    console.log("setting session id to "  + storeEvent.sessionId);
                    this.sessionId = storeEvent.sessionId;
                } else {
                    const fromSelf = storeEvent.sessionId === this.sessionId;
                    this.notifyListeners(fromSelf, storeEvent.type, storeEvent.aggId, storeEvent.version, storeEvent.data);
                }
                this.cursor = storeEvent.version;
            }
        };
        this.socket.onclose = (event) => {
            console.log("EventBus closed:", event.code);
            // see https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent for codes
            if (event.code == 1006) {
                // -> abnormal close
                setTimeout(() => {
                      this.openSocket(url)
                    },
                    1000
                );

            }
        }

        this.socket.onerror = (err: ErrorEvent) => {
            console.log("EventBus error:", err);
        };
    }
    public postNoteCreated(aggId: string, noteType: string, x: number, y: number): NoteCreatedEvent {
        let event = new NoteCreatedEvent(aggId, noteType, x, y);
        this.postEvent(aggId, event);
        return event
    }


    public postNoteLabelChanged(aggId: string, newLabel: string) {
        let event = new NoteLabelChangedEvent(aggId, newLabel);
        this.postEvent(aggId, event);
    }

    public postNoteMoved(aggId: string, x: number, y: number) {
        let event = new NoteMovedEvent(aggId, x, y);
        this.postEvent(aggId, event);
    }


    public postNoteDeleted(aggId: string) {
        let event = new NoteDeletedEvent(aggId);
        this.postEvent(aggId, event);
    }

    registerListener(aListener: NoteEventListener) {
        this.listeners.push(aListener);
    }

    private postEvent(aggId: string, event: NoteEvent) {
        console.log("EventBus postEvent", event);
        this.socket.send(
            JSON.stringify({
                sessionId: this.sessionId,
                action: 'appendEvent',
                type: event.type,
                aggId: aggId,
                data: event
            })
        );
    }

    private notifyListeners(fromSelf: boolean, type: string, aggId: string, version: number, event: NoteEvent) {
        this.listeners.forEach((listener) => {
            listener.onEvent(fromSelf, type, aggId, version, event)
        })
    }

}
