/**
 * Created by tom on 16.02.17.
 */

import {StreamRepo} from "./StreamRepo";
import {ESEvent, uuid} from "./EventStoreDefs";
const debug = require('debug')('EventStream');



class Subscriber {
    constructor(public filter : (event : ESEvent) => boolean,
                public callback : (event : ESEvent) => void) {}
}

export class EventStream {
    private events : ESEvent[] = []
    private subscribers : {[id : string] : Subscriber} = {}

    constructor(private persistence : StreamRepo, public name : string, public uuid : string, aEvents ?: ESEvent[]) {
        if (aEvents) {
            this.events = aEvents;
        } else {
            this.append(new ESEvent('::Store::Named', this.nextVersion(), null, {name : name}));
        }
    }

    public rename(newName : string) {
        this.name = newName;
        this.append(new ESEvent('::Store::Named', this.nextVersion(), null, {name : newName}));
    }
    private upToDateSubscriber(subscriber : Subscriber) {
        this.events
            .filter(subscriber.filter)
            .forEach(subscriber.callback);
    }

    public appendEvent(type : string, aggId : string, data : Object, version = 0) : number {
        // TODO: how do we handle collisions?
        debug("appendEvent", type, aggId, version, "\n");
        const esEvent = new ESEvent(type, this.nextVersion(), aggId, data);
        this.append(esEvent);
        for (var key in this.subscribers) {
            const subscriber = this.subscribers[key];
            if (subscriber.filter(esEvent)) subscriber.callback(esEvent);
        }
        return esEvent.version;
    }

    private nextVersion() : number {
        return this.events.length > 0 ? this.events[this.events.length - 1].version + 1 : 1;
    }

    private append(event : ESEvent) {
        this.events.push(event);
        this.persistence.appendToStream(this.uuid, event);
    }

    public subscribeForAggregate(callback : (event: ESEvent) => void, aggId : string, fromVersion = 0) : string {
        let subscriber = new Subscriber(
                (event : ESEvent) => {
                    return event.aggId === aggId && event.version >= fromVersion;
                },
                callback
            );
        return this.subscribe(subscriber);
    }

    public subscribeForType(callback : (event: ESEvent) => void, typeMatcher : (type : string) => boolean, dataMatcher ?: (data : Object) => boolean, fromVersion = 0) {
        // matching on vesion is ok, since version increases with each event
        let subscriber = new Subscriber(
            (event : ESEvent) => {
                let matched = event.version >= fromVersion && typeMatcher(event.type);
                return dataMatcher != undefined ? matched && dataMatcher(event) : matched;
            },
            callback
        );
        return this.subscribe(subscriber);
    }

    public unsubscribe(id: string) {
        delete this.subscribers[id];
    }

    private subscribe(subscriber : Subscriber) {
        const subscriberId = uuid();
        this.subscribers[subscriberId] = subscriber;
        this.upToDateSubscriber(subscriber);
        return subscriberId;
    }
}

export default EventStream;