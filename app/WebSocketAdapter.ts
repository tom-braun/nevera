/**
 * Created by tom on 18.02.17.
 */


import { Server } from 'ws';
import { parse, Url } from 'url';
import {EventStore} from "./EventStore";
import {ESEvent, uuid} from "./EventStoreDefs";


class ESCommand {
    public sessionId : string;
    public action : string;
    public type : string;
    public aggId : string;
    public data : any;
    /* for subscribe events: only send events with event.version > version. */
    public version : number;
}

export class WebSocketAdapter {

    constructor(server : Server, eventStore : EventStore) {
        server.on('connection', ws => {
            let subscriberIds : string[] = [];
            const sessionId = uuid();
            console.log("new connection socket:", ws.upgradeReq.url);
            const url = parse(ws.upgradeReq.url, true);
            const stream = this.getStream(eventStore, url);
            ws.on('close', (code, msg) => {
                console.log("socket closed: " + code + " " + msg);
                subscriberIds.forEach((id) => {
                    stream.unsubscribe(id);
                })

            });
            ws.on('error', (err : Error) => {
                console.log("error:", err);
            });
            ws.on('message', (message, flags) => {
                console.log("message:", JSON.stringify(message));
                const command : ESCommand = JSON.parse(message);
                const event = command.data === undefined ? {} : command.data;
                if (command.action === 'create') {
                    const streamId = eventStore.createStream(event.name);
                    ws.send(JSON.stringify({ streamId: streamId }));
                } else {
                    const stream = this.getStream(eventStore, url);
                    if (command.action === 'appendEvent') {
                        const version = stream.appendEvent(command.sessionId, command.type, command.aggId, command.data);
                    } else if (command.action === 'subscribeForAggregate'){
                        subscriberIds.push(stream.subscribeForAggregate(event => {
                            ws.send(JSON.stringify(event))
                        }, command.aggId, command.version+1));
                    } else if (command.action === 'subscribeForAll'){
                        subscriberIds.push(stream.subscribeForType(event => {
                            console.log("subscribeForAll.callback ", event);
                            ws.send(JSON.stringify(event));
                        }, () => {
                            return true;
                        }, () => {
                            return true;
                        }, command.version+1));
                    }
                }
            });

            ws.send(JSON.stringify({type: '_sessionInfo', sessionId: sessionId}));
        });
    }

    private getStream(eventStore: EventStore, url: Url) {
        console.log("getStream: ", url.path);
        const streamId : string = url.path.substring(url.path.lastIndexOf("/")+1);
        console.log("getStream: ", streamId);
        return eventStore.getStream(streamId);
    }
}

export default WebSocketAdapter;