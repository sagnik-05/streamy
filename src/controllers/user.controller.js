import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken'

// generate access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); // Save the refreshToken

        // console.log("Generated Tokens:", { accessToken, refreshToken }); // Debugging

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error generating token");
    }
};

// rgister a user
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
    // console.log(req.body);
    // console.log(req.files);
    if(
        [fullName, username, email, password].some((field) => // check if any field is empty after trimming
        field?.trim() === "")
    )
    {
        throw new ApiError(400, "All fields are required");
    }
    const existedUser = await User.findOne({ // check if user already exists by username or email
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


// login a user
const loginUser = asyncHandler( async (req, res) =>{
    // get the user details from frontend
    // validate user details
    // check if user exists if not sent to register page
    // check if password is correct
    // generate token
    // return response to frontend
    const {email, username, password} = req.body;
    // Log the request body for debugging
    console.log("Request body:", req.body);
    if(!email && !username){
        throw new ApiError(400, "Email or username is required");
    }
    if(!password){
        throw new ApiError(400, "Password is required");
    }
    // check if user exists
    const user = await User.findOne({$or: [{email}, {username}]})
    // if user does not exist
    if(!user){
        throw new ApiError(404, "User not found");
    }
    const isPasswordValid = await user.isPasswordCorrect(password) // check if password is correct (isPasswordCorrect is coming from user model)
    if(!isPasswordValid){ // if password is not correct
        throw new ApiError(401, "Invalid password");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id) // generate tokens

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken") // remove password and refreshToken from response
    // we use options to set the cookie to be httpOnly and secure
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})  

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
}) // this is failing to add the middleware (may have some bugs)

const refreshAcceessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");

    // console.log("Cookies:", req.cookies);  // Check if cookies are available
    // console.log("Authorization Header:", req.header("Authorization"));  // Check if header exists
    //console.log("Extracted Token:", incomingRefreshToken);  // Check if token was extracted correctly
    // console.log(incomingRefreshToken)
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }
    try {
        const decodeToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodeToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newRefreshToken} =  await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, {}, "Token refreshed successfully")
        )   
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token !!")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res)=>{
    const {oldPassword, newPassword} = req.body;
    if(!oldPassword || !newPassword){
        throw new ApiError(400, "All fields are required");
    }
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword) // check if old password is correct
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid old password")
    }
    user.password = newPassword;
    await user.save({validateBeforeSave: false});
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) =>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully")) // return the current user from the request object through the middleware
})
const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body;
    if(!fullName || !email){
        throw new ApiError(400, "All fields are required");
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{  // set the fields to be updated
                fullName,
                email
            }
        },
        {new : true} // return the updated document
    ).select("-password") // remove password  from response
    if(!user){
        throw new ApiError(500, "Error updating user")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"))

})
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.files?.avatar[0]?.path; // get the avatar from the request object
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath); // upload the avatar to cloudinary
    if(!avatar.url){
        throw new ApiError(500, "Error uploading avatar");
    }
    const user = await User.findByIdAndUpdate( // update the avatar in the database
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new : true}
    ).select("-password") 
    if(!user){
        throw new ApiError(500, "Error updating user")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))
})
const upadateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image is required");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(500, "Error uploading cover image");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new : true}
    ).select("-password")
    if(!user){
        throw new ApiError(500, "Error updating user")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"))
})


export {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAcceessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetailss, 
    updateUserAvatar,
    upadateUserCoverImage
} // export the functions to be used in the routes