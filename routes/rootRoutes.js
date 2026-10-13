import express from "express";
import {
    redirectToLoginController
} from "../controller/userController.js";

const Router = express.Router();

Router.get("/", redirectToLoginController);

export default Router;