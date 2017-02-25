/**
 * Created by tom on 19.02.17.
 */

import { EventStore } from './EventStore';

import { expect } from 'chai';

describe("EventStore", () => {
    describe("createStream returns the streams id", () => {
        const eventStore = new EventStore();
        expect(eventStore.createStream("some name").length).to.above(3);
    });
}