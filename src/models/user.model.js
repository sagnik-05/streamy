import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        type: String, // cloudinary url
        default: "/images/default-avatar.png",
        required: true
    },
    coverImage:{
        type: String, // cloudinary url
        default: "/images/default-cover.png",
    },
    watchHistory:{
        typee: Schema.Types.ObjectId,
        ref: "Video"
    },
    password:{
        type: String,
        required: true,
    },
    refreshToken:{
        type: String
    }
},
{timestamps: true}
)
// encrypt password before saving to database
userSchema.pre("save", async function(next){  // arrow function does not work here and next is used to move to the next part
    if(!this.isModified("password")) // check if the password is not modified it means user already exists then move to the next part
    {
        next()
    }
    this.password = await bcrypt.hash(this.password, 10) // hash the password. 10 is the salt
    next()
    
}) 

userSchema.methods.isPasswordCorrect = async function(password){ // check if the password is correct
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
userSchema.methods.generateRefreshToken = function(){
    jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullname
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}


export const User = mongoose.model("User", userSchema);