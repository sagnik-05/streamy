import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';
const registerUser = asyncHandler( async (req, res) =>{
    // get user details from frontend
    // validation of user details
    // check if user already exists
    // check for images and avatar
    // upload images to cloudinary
    // remove password and refreshToken from response
    // create user and save user to database
    // return response to frontend
    const {username, email, password, fullName} = req.body;
    console.log("email: ", email);
    if(
        [fullName, username, email, password].some((field) => // check if any field is empty after trimming
        field?.trim() === "")
    )
    {
        throw new ApiError(400, "All fields are required");
    }
    const existedUser = User.findOne({ // check if user already exists by username or email
        $or: [{username}, {email}] // if username or email already exists
    })
    if(existedUser){
        throw new ApiError(409, "User already exists");
    }
    // check if avatar and coverImage exists
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null

    if(!avatar){
        throw new ApiError(400, "Error uploading avatar");
    }
    const user = await User.create({
        username,
        email,
        password,
        fullName,
        avatar : avatar.url, 
        coverImage : coverImage?.url || ""
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken") // remove password and refreshToken from response
    if(!createdUser){
        throw new ApiError(500, "Error creating user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    )
})

export {registerUser}