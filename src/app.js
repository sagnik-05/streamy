import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();
// setting up cors origin
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
));

// setting up middlewares
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(cookieParser());


// setting up routes
import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users", userRouter) // http://localhost:3000/api/v1/users/{routes}
export default app;