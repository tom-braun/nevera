/**
 * Created by tom on 16.02.17.
 */

export function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

export class ESEvent {
    constructor(public type : string, public version : number, public aggId : string, public data : Object) {
    }
}

class Subscriber {
    constructor(public filter : (event : ESEvent) => boolean,
                public callback : (event : ESEvent) => void) {}
}

export class EventStream {
    private events : ESEvent[] = []
    private subscribers : {[id : string] : Subscriber} = {}

    constructor(public name : string, public uuid : string) {}

    private nextVersion() : number {
        return this.events.length > 0 ? this.events[this.events.length - 1].version + 1 : 1;
    }

    private upToDateSubscriber(subscriber : Subscriber) {
        this.events
            .filter(subscriber.filter)
            .forEach(subscriber.callback);
    }

    public appendEvent(type : string, aggId : string, data : Object, version = 0) : number {
        // TODO: how do we handle collisions?
        console.log("appendEvent", type, aggId, version, "\n");
        const esEvent = new ESEvent(type, this.nextVersion(), aggId, data);
        this.events.push(esEvent);
        for (var key in this.subscribers) {
            const subscriber = this.subscribers[key];
            if (subscriber.filter(esEvent)) subscriber.callback(esEvent);
        }
        return esEvent.version;
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
        console.log("unsubscribing", id);
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