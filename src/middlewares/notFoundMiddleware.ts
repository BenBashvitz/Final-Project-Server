import {NextFunction, RequestHandler, Response, Request} from "express";

export const notFoundMiddleware: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).send('Resource not found');
    }

    next();
}
