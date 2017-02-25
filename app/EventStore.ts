/**
 * Created by tom on 18.02.17.
 */
import {EventStream, uuid} from "./EventSteam";



export class ESStream {
    constructor(public name : string,  public uuid : string) {
    }
}

export class EventStore {
    private streams : {[id : string] : EventStream} = {};

    constructor() {}



    createStream(name : string) : string {
        const id = uuid();
        this.streams[id] = new EventStream(name, id);
        return id;
    }

    getStream(streamId : string) : EventStream {
        return this.streams[streamId];
    }

    openStream(streamId : string) : EventStream {
        return this.streams[streamId];
    }

    allStreams() : ESStream[] {
        return Object.keys(this.streams).map(key => {
            const stream = this.streams[key];
            return new ESStream(stream.name, stream.uuid);
        });
    }
}

export default EventStore;