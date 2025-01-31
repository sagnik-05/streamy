import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAcceessToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)
router.route("/login").post(loginUser)
//router.route("/logout").get(logoutUser)
// secured routes
router.route("/logout").get(verifyJWT, logoutUser) // verifyJWT is a middleware that checks if the user is authenticated but it has some issues
router.route("/refresh-token").post(refreshAcceessToken)

export default router; // when exported default it can be imported with any name
