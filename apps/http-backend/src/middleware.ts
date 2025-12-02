import { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from "@repo/backend-common/config";
import jwt from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            userId: string;
        }
    }
}

export function middleware(req: Request, res: Response, next: NextFunction){
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const token = authHeader.replace("Bearer ", "");

        const decoded = jwt.verify(token, JWT_SECRET);

        if ((decoded as any).userId) {
            req.userId = (decoded as any).userId;
            return next();
        }

        return res.status(403).json({ message: "Unauthorized" });

    } catch (error) {
        return res.status(403).json({ message: "Unauthorized" });
    }
}
