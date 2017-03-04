import {EventStream} from "./EventStream";

/**
 * Created by tom on 28.02.17.
 */

import * as fs from 'fs';
import {StreamInfo, ESEvent} from "./EventStoreDefs";


export interface StreamRepo {
    loadStreamsInfo(): StreamInfo[];
    storeStreamsInfo(streamsInfo: StreamInfo[]);
    appendToStream(streamId: string, event: ESEvent);
    loadStream(streamId: string, name: string) : EventStream;
}

export class StreamFSRepo implements StreamRepo {
    constructor(private dataDir: string) {

    }

    loadStreamsInfo(): StreamInfo[] {
        const fileName = this.storeInfoFile();
        if (fs.existsSync(fileName)) {
            return JSON.parse(fs.readFileSync(fileName, 'utf8'))
        }
        return [];
    }

    storeStreamsInfo(streamsInfo: StreamInfo[]) {
        fs.writeFileSync(`${this.dataDir}/stores`, JSON.stringify(streamsInfo), 'utf8');
    }

    appendToStream(streamId: string, event: ESEvent) {
        const data = JSON.stringify(event);
        fs.appendFileSync(this.streamFile(streamId), data + ',', 'utf8');
    }

    loadStream(streamId: string, name: string) : EventStream {
        let data = "[" + fs.readFileSync(this.streamFile(streamId), 'utf8');
        data = data.substr(0, data.length-1) + "]";
        const events = JSON.parse(data);
        return new EventStream(this, name,  streamId, events);
    }

    private storeInfoFile() {
        return `${this.dataDir}/stores`;
    }

    private streamFile(streamId : string) {
        return `${this.dataDir}/store-${streamId}`
    }
}