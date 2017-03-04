/**
 * Created by tom on 18.02.17.
 */
import {EventStream} from "./EventStream";

import {StreamRepo} from "./StreamRepo";
import {StreamInfo, uuid} from "./EventStoreDefs";


interface StreamEntry extends StreamInfo {
    stream: EventStream;
}

export class EventStore {
    private streams: {[id: string]: StreamEntry} = {};


    constructor(private streamRepo: StreamRepo) {
        const streamsInfo = streamRepo.loadStreamsInfo();
        streamsInfo.forEach(info => {
            this.streams[info.id] = {id: info.id, name: info.name, stream: undefined};
        });
    }


    private persist() {
        const streams = []
        for (var key in this.streams) {
            streams.push({id: key, name: this.streams[key].name});
        }

        this.streamRepo.storeStreamsInfo(streams);
    }

    createStream(name: string): string {
        const id = uuid();
        this.streams[id] = {id: id, name: name, stream: new EventStream(this.streamRepo, name, id)};
        this.persist();
        return id;
    }

    getStream(streamId: string): EventStream {
        const streamInfo= this.streams[streamId];
        if (!streamInfo.stream) {
            streamInfo.stream = this.streamRepo.loadStream(streamId, streamInfo.name );
        }
        return streamInfo.stream;
    }

    allStreams(): StreamInfo[] {
        return Object.keys(this.streams).map(key => {
            const stream = this.streams[key];
            return {id: stream.id, name: stream.name};
        });
    }

    renameStream(streamId: string, newName: string) {
        if (!newName || newName.length === 0) {
            newName = "n/a";
        }
        const stream = this.getStream(streamId);
        if (stream) {
            this.streams[streamId].name = newName;
            stream.rename(newName);
            this.persist();
        } else {
            throw new Error("no such stream");
        }
    }
}

export default EventStore;