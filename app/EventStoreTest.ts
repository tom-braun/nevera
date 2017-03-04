///<reference path="../node_modules/@types/mocha/index.d.ts" />

import {EventStore} from './EventStore';

import {expect} from 'chai';
import {StreamRepo, StreamFSRepo} from "./StreamRepo";
import {StreamInfo, ESEvent} from "./EventStoreDefs";
import {EventStream} from "./EventStream";


class StreamRepoStub implements StreamRepo {
    loadStreamsInfo(): StreamInfo[] {
        return [];
    }

    storeStreamsInfo(streamsInfo: StreamInfo[]) {

    }

    appendToStream(streamId: string, event: ESEvent) {
    }

    loadStream(streamId: string, name: string): EventStream {
        return undefined;
    }
}

describe("EventStore", () => {
    let eventStore: EventStore;

    beforeEach(() => {
        const stub = new StreamRepoStub();
        eventStore = new EventStore(stub);
    });

    it("createStream returns the streams id", () => {
        expect(eventStore.createStream("some name").length).to.above(3);
    });

    it("a stream may be renamed", () => {
        const stub = new StreamRepoStub();
        let stream = eventStore.createStream("old name");
        eventStore.renameStream(stream, "new name");
        expect(eventStore.getStream(stream).name).to.equal("new name");
    });

    it("renameStream will fail if store does not exist", () => {
        expect(() => eventStore.renameStream("no-such-stream", "new name")).to.throw(Error);
    });
});