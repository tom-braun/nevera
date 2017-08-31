///<reference path="../EventStore.ts"/>
import {Router, Request, Response, NextFunction} from  'express';
import {EventStore} from '../EventStore'
import {isNullOrUndefined} from "util";
import {ESCommand} from "../WebSocketAdapter";
import {STATUS_CODES} from "http";

const debug = require('debug');

export class BoardRouter {
    public router: Router;

    constructor(eventStore: EventStore, port : number) {
        if (eventStore === undefined) throw "undefined";
        this.router = Router();
        this.init(eventStore, port);
    }

    init(eventStore: EventStore, port : number) {
        /* GET home page. */
        this.router.get('/', function (req: Request, res: Response, next: NextFunction) {
            res.redirect("/boards");
        });

        /**
         * List available Boards
         */
        this.router.get('/boards', function (req: Request, res: Response, next: NextFunction) {
            res.render('boards', {boards: eventStore.allStreams()});
        });

        /**
         * Create a new Board.
         */
        this.router.post('/boards', (req, res, nextFunction) => {
            console.log("POST boards", req.body.name);
            const name = req.body.name === "" ? "n/a" : req.body.name;
            const boardId = eventStore.createStream(name);
            console.log("Created board: " + boardId);
            res.redirect('/boards/' + boardId)
        });

        this.router.get('/boards/:boardId', function (req: Request, res: Response, next: NextFunction) {
            debug("selected board:", req.params.boardId);

            const board = eventStore.getStream(req.params.boardId);
            if (board === undefined) {
                res.redirect('/boards')
            } else {
                res.render('board', {
                    boardId: req.params.boardId,
                    hostname: req.hostname,
                    name : board.name,
                    port : port
                });
            }
        });

        this.router.put('/boards/:boardId/name/:newName', (req: Request, res: Response, next: NextFunction) => {
            try {
                console.log("put name ", req.params.newName);
                eventStore.renameStream(req.params.boardId, req.params.newName);
                res.status(204);
            } catch (e) {
                res.status(404)
            }
        });

        this.router.post('/boards/:boardId', (req: Request, res: Response, next: NextFunction) => {
            console.log("Posting to stream", req.params.boardId, req.body);
            console.log("---");
            const stream = eventStore.getStream(req.params.boardId);
            const command : ESCommand = req.body;
            const version = stream.appendEvent(command.sessionId, command.type, command.aggId, command.data);
            res.status(204);
        });


    }
}

export default BoardRouter;
