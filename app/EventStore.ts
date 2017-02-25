/**
 * Created by tom on 18.02.17.
 */
import {EventStream, uuid} from "./EventSteam";
import * as fs from 'fs';


export class ESStream {
    constructor(public name : string,  public uuid : string) {
    }
}

export class EventStore {
    private streams : {[id : string] : EventStream} = {};

    constructor() {
        if (fs.existsSync('data/stores')) {
            console.log("data/stores");
            const streams = JSON.parse(fs.readFileSync('data/stores', 'utf8'))
            streams.forEach(entry => {
                console.log("entry:", entry)
                this.streams[entry.key] = EventStream.load(entry.key, entry.name);
            });
        }
    }


    private persist() {
        const streams  = []
        for (var key in this.streams) {
            streams.push({key : key, name: this.streams[key].name});
        }
        fs.writeFileSync('data/stores', JSON.stringify(streams), 'utf8');
    }

    createStream(name : string) : string {
        const id = uuid();
        this.streams[id] = new EventStream(name, id);
        this.persist();
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