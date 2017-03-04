/**
 * Created by tom on 27.02.17.
 */

import * as http from 'http';
import * as express from "express";
import {BoardRouter} from "./routes/BoardRouter";
import {EventStore} from "./EventStore";
import {WebSocketAdapter} from "./WebSocketAdapter";
import * as WebSocket from 'ws';
import {StreamFSRepo} from "./StreamRepo";




const logger = require('morgan');


class Context {
    readonly persistence = new StreamFSRepo("data");
    readonly eventStore = new EventStore(this.persistence);
    readonly webSocketAdapter: WebSocketAdapter;
    readonly boardRouter : BoardRouter;

    constructor(server : http.Server, port : number) {
        const wss = new WebSocket.Server({
            server: server
        });
        this.webSocketAdapter = new WebSocketAdapter(wss, this.eventStore);
        this.boardRouter = new BoardRouter(this.eventStore, port);
    }
}

export class BoardServer {
    public server : http.Server;

    constructor(private host : string, private port : number) {
        const app = express();
        app.set('port', port);
        app.set('hostname', host);
        console.log(`BoardServer ${host}:${port}`);
        this.server = http.createServer(app);
        const context = new Context(this.server, port);
        BoardServer.initMiddleware(app);
        BoardServer.initRenderingEngine(app);
        BoardServer.initRoutes(app, context);
    }

    private static initMiddleware(app: express.Application) {
        const bodyParser = require('body-parser');
        app.use(require('morgan')('dev'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(require('cookie-parser')());
    }

    private static initRenderingEngine(app: express.Application) {
        const path = require('path');
        app.set('view engine', 'pug');
        app.set('views', path.join(__dirname, 'views'));
        app.use(express.static(path.join(__dirname, '../public')));
    }

    private static initRoutes(app: express.Application, context : Context) {

        app.use('/', context.boardRouter.router);

        // ------------------------- catch 404 and forward to error handler
        app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            err.status = 404;
            next(err);
        });
        app.use(require('errorhandler')());
    }
}

export default BoardServer;
