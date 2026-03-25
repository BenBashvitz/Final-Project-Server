import userModel from "../models/userModel";
import BaseController from "./baseController";

const userController = new BaseController(userModel);

export default userController
