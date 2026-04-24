// Noam-Shimoni-213785298-Ben-Bashvitz-324228139
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import config from "./configs/envVar";
import path from "path";
import baseRouter from "./routes/baseRoutes";
import {notFoundMiddleware} from "./middlewares/notFoundMiddleware";

const initApp = async () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(
        cors({
            origin: config.CLIENT_URL,
            credentials: true,
        }),
    );

    await mongoose.connect(config.MONGODB_URL);

    const db = mongoose.connection;

    db.on("error", (error) => {
        console.error("An error occurred while connecting to MongoDB: ", error);
    });

    db.once("open", () => {
        console.log("Connected to MongoDB");
    });

    app.use("/api", baseRouter);

    app.use(notFoundMiddleware);

    if (process.env.NODE_ENV === "production") {
        app.use(express.static(path.join(process.cwd(), 'public', 'client')));

        app.get('/*splat', (req, res) => {
            res.sendFile(path.join(process.cwd(), 'public', 'client', 'index.html'));
        });
    }

    return app;
};

export default initApp;
