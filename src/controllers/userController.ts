import userModel from "../models/userModel";
import BaseController from "./baseController";
import {AuthRequest} from "../types/request";
import {RawUser} from "../types/user";
import {Response} from 'express';
import {IdSchema} from "../schemas/common";
import {UserUpdateSchema} from "../schemas/user";
import z, {ZodError} from "zod";

class UserController extends BaseController<RawUser> {
    constructor() {
        super(userModel);
    }

    override async put(req: AuthRequest, res: Response) {
        try {
            const id = IdSchema.parse(req.params.id);

            const user = await this.model.findById(id);

            if (!user) {
                return res.status(404).send(`The user was not found`);
            }

            if (id.toString() !== req.user?._id) {
                return res.status(403).send("You are not authorized to update this user");
            }

            const userUpdate = UserUpdateSchema.parse(req.body);

            const updatedData = await this.model.findByIdAndUpdate(id, userUpdate, {
                new: true,
                runValidators: true,
                projection: {_id: 1, username: 1, imgUrl: 1},
            });

            if (!updatedData) {
                return res.status(404).send(`The user was not found`);
            }

            return res.status(200).json(updatedData);
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).send(z.treeifyError(error));
            }

            console.error(`An error occurred while updating the user: `, error);

            return res.status(500).send(`An error occurred while updating the user`);
        }
    }
}

export default new UserController();
