import mongoose from "mongoose";
async function connectDB(dbname)
{
    try{
        const DB_uri=`mongodb+srv://tdb_user:NrSiRp8Alm3Bzy@cluster0.ew5ssyi.mongodb.net/${dbname}?retryWrites=true&w=majority`;
        await mongoose.connect(DB_uri);
        console.log('mongo connected successfully');
    }
    catch(error)
    {
console.log('ERROR!',error.message);
    }
}
export default connectDB;
