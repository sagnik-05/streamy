import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        //const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        // console.log("Cookies:", req.cookies);  // Check if cookies are available
        // console.log("Authorization Header:", req.header("Authorization"));  // Check if header exists
        // console.log("Extracted Token:", token);  // Check if token was extracted correctly
        console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    
})

// purpose of this middleware is to check if the user is logged in or not
// if the user is logged in, then the user object will be attached to the request object
// if the user is not logged in, then an error will be thrown
// this middleware will be used in routes where we need to check if the user is logged in or not