// import dotenv from "dotenv"
// dotenv.config({path:"./env/.env"})
import "dotenv/config";

import express from "express";
import path from "path";
import cookieparser from "cookie-parser";
import { fileURLToPath } from "url";
import userRouter from "./routes/userRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import adminCategoryRouter from "./routes/adminCategoryRouter.js"
import adminProductRouter from "./routes/adminProductRouter.js"
import bcrypt from "bcrypt"
import session from "express-session";
import { connect } from "./config/connectDB.js";
import passport from "./config/passport.js";
import { blockCheckMiddleware } from "./middleware/blockCheckMiddleware.js";
import {createAdmin} from "./middleware/AdminAuth.js"
import errorHandler from "./middleware/erroHandler.js";
import { wishlistCount } from "./middleware/wishlistMiddleware.js";
import { cartCount } from "./middleware/cartMiddleware.js"
import { userEmail,locals,cachey,sessionMiddleware } from "./middleware/localsMiddleware.js";
import rootRouter from "./routes/rootRoutes.js"

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieparser());

app.use(sessionMiddleware);

app.use(cachey);

app.use(locals);


app.use(passport.initialize());
app.use(passport.session());

app.use(userEmail)



createAdmin()
app.use(wishlistCount)
app.use(cartCount)
app.use("/", rootRouter);
app.use("/user", blockCheckMiddleware, userRouter);
app.use("/admin",adminRouter)
app.use("/admin/product", adminProductRouter);
app.use("/admin/category", adminCategoryRouter);


app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        await connect();

        app.listen(PORT, () => {
            console.log("server is listening", PORT);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
}

startServer()
