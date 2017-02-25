import {Router, Request, Response, NextFunction} from  'express';
import {EventStore} from '../app/EventStore'


export class BoardRouter {
    readonly router: Router;

    constructor(eventStore: EventStore) {
        if (eventStore === undefined) throw "undefined";
        this.router = Router();
        this.init(eventStore);
    }

    init(eventStore: EventStore) {
        /* GET home page. */
        this.router.get('/', function (req: Request, res: Response, next: NextFunction) {
            res.redirect("/boards");
        });

        this.router.get('/boards', function (req: Request, res: Response, next: NextFunction) {
            res.render('boards', {boards: eventStore.allStreams()});
        });

        this.router.get('/boards/:boardId', function (req: Request, res: Response, next: NextFunction) {
            console.log("selected board:", req.params.boardId);

            const board = eventStore.getStream(req.params.boardId);
            if (board === undefined) {
                res.redirect('/boards')
            } else {
                res.render('board', {boardId: req.params.boardId, hostname: req.hostname, name : board.name});
            }
        });

        this.router.post('/boards', (req, res, nextFunction) => {
            console.log("POST boards", req.body.name);
            const name = req.body.name === "" ? "n/a" : req.body.name;
            const boardId = eventStore.createStream(name);
            res.redirect('/boards/' + boardId)
        });
    }
}

export default BoardRouter;
