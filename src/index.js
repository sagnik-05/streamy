import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({ path: "./env" });

// connect to the database
connectDB()
.then(()=>{
    app.listen(process.env.port,()=>{
        console.log(`Server is running on port ${process.env.port}`)
    })
})
.catch((err)=>{
    console.log("Database connection error: ", err)
    throw err
})





















































/*
const app = express();
(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/{DB_NAME}`)
        app.on("error", (err) => {
            console.log("Error: ", err)
            throw err
        })
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        })
    }catch(err){
        console.log("Error: ", err)
        throw err
    }
})()
*/