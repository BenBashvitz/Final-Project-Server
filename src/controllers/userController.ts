import userModel from "../models/userModel";
import BaseController from "./baseController";
import {RawUser} from "../types/user";
import {AuthRequest} from "../types/request";
import {Response} from 'express';
import {UserIdSchema} from "../schemas/user";

class UserController extends BaseController<RawUser> {
    constructor() {
        super(userModel);
    }

    override async getById(req: AuthRequest, res: Response) {
        const { id } = UserIdSchema.parse(req.params);

        const user = await this.model.findById(id);

        if(!user) {
            return res.status(404).send(`The user was not found`);
        }

        return super.getById(req, res);
    }
}

export default new UserController();
