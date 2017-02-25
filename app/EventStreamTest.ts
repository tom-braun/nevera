/**
 * Created by tom on 16.02.17.
 */

import { EventStream, ESEvent } from './EventSteam';

import { expect } from 'chai';

describe("EventStream", () => {
    var eventStore : EventStream;

    beforeEach( () => {
        console.log("new EventStream()");
        eventStore = new EventStream();
    });

    describe("given we have a two subscribers on different aggregates", () => {
        let eventsSub0 = [];
        let eventsSub1 = [];

        beforeEach(() => {
            eventsSub0 = [];

            eventStore.subscribeForAggregate((event : ESEvent) => {
                eventsSub0.push(event);
            }, "agg-id-0", 0);

            eventStore.subscribeForAggregate((event : ESEvent) => {
                eventsSub1.push(event);
            }, "agg-id-1", 0);
        });

        describe("when an event is appended", () => {

            beforeEach('appendEvent', () => {
                eventStore.appendEvent("SomeEvent", "agg-id-0", null, 0);
            })

            it('then the event should be send to subscriber 0', () => {
                expect(eventsSub0.length).to.equal(1);
            });

            it('but not to subscriber 1', () => {
                expect(eventsSub1.length).to.equal(0);
            });

        });

        describe("when three events are appended for an aggregate", () => {
            beforeEach('appendEvent', () => {
                eventStore.appendEvent("SomeEvent", "agg-id-0", null, 0);
                eventStore.appendEvent("SomeEvent", "agg-id-0", null, 1);
                eventStore.appendEvent("SomeEvent", "agg-id-0", null, 2);
            });

            it("then each event has an incremented version number", () => {
                expect(eventsSub0.map((e) => e.version).join(",")).to.equal("1,2,3");
            });
        });


    });

    describe("given we have a two subscribers on different event types", () => {
        let eventsSub0 = [];
        let eventsSub1 = [];

        beforeEach(() => {
            eventsSub0 = [];

            eventStore.subscribeForType(
                (event) => { eventsSub0.push(event); },
                (type) => { return type === "EventType0"; }
            );

            eventStore.subscribeForType(
                (event) => { eventsSub1.push(event); },
                (type) => { return type === "EventType1"; }
            );
        });

        describe("when an event is appended", () => {

            beforeEach('appendEvent', () => {
                eventStore.appendEvent("EventType0", "agg-id-0", null, 0);
            })

            it('then the event should be send to subscriber 0', () => {
                expect(eventsSub0.length).to.equal(1);
            });

            it('but not to subscriber 1', () => {
                expect(eventsSub1.length).to.equal(0);
            });

        });
    });

    describe("given there are already some events in the store", () => {
        let eventsSub0 = [];
        let eventsSub1 = [];

        beforeEach('appendEvent', () => {
            eventsSub0 = [];
            eventsSub1 = [];

            console.log("before");
            eventStore.appendEvent("EventType0", "agg-id-0", null, 0);
            eventStore.appendEvent("EventType0", "agg-id-1", null, 1);
            eventStore.appendEvent("EventType1", "agg-id-0", null, 2);
            eventStore.appendEvent("EventType0", "agg-id-2", null, 3);

            eventStore.subscribeForAggregate((event : ESEvent) => {
                eventsSub0.push(event);
            }, "agg-id-0", 0);

            eventStore.subscribeForType(
                (event) => { eventsSub1.push(event); },
                (type) => { return type === "EventType0"; }
            );
        });

        describe("when a new subscriber subscribes for an aggregate", () => {
            it('then it will immediately receive all matching events from the store', () => {
                expect(eventsSub0.length).to.equal(2);
            });
        });

        describe("when a new subscriber subscribes for the event type", () => {
            it('then it will immediately receive all matching events from the store', () => {
                expect(eventsSub1.length).to.equal(3);
            });
        });
    });

    describe("given an empty store", () => {
        it("when appending events the new version will be returned", () => {
            expect(eventStore.appendEvent("EventType0", "agg-id-0", null)).to.equal(1);
            expect(eventStore.appendEvent("EventType0", "agg-id-1", null, 1)).to.equal(2);
            expect(eventStore.appendEvent("EventType1", "agg-id-0", null, 2)).to.equal(3);
            expect(eventStore.appendEvent("EventType0", "agg-id-2", null, 3)).to.equal(4);
        });
    });
});

