import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
mongoose.set('strictQuery', true)

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.log("Error: ", err);
        throw err;
    }
}
export default connectDB;