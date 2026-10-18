import mongoose from "mongoose";
async function connectDB(dbname)
{
    try{
        const DB_uri= process.env.MONGODB_URI;
        await mongoose.connect(DB_uri, { dbName: dbname });
        console.log('mongo connected successfully');
    }
    catch(error)
    {
console.log('ERROR!',error.message);
    }
}
export default connectDB;
