/**
 * Created by tom on 28.02.17.
 */
export interface StreamInfo {
    id : string;
    name : string;
}

export function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

export class ESEvent {
    constructor(public sessionId: string, public type : string, public version : number, public aggId : string, public data : Object) {
    }
}