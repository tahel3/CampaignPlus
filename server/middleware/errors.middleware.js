import express from 'express';
/**
 * 
 * @param {express.Request} req 
 * @param {*} res 
 * @param {*} next 
 */
export const urlNotFound=(req,res,next)=>{
next({
    status:404,
    type:'not found',
    msg: `url not found (${req.url}, method: ${req.method})`
});
};
/**
 * מידלוואר שמטפל בשגיאות
 * @param {{ status?:number, type?:string, msg:string }} err 
 * @param {express.Request} req 
 * @param {*} res 
 * @param {*} next 
 */
export const errorHandler=(err,red,res,next)=>{
    const error={
        message:err.msg,
        type:err.type||"server error"
    }
    const {status=500}=err;
    res.status(status).json({ error: error });
};
