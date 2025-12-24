import {model, Schema} from 'mongoose';
import Joi from 'joi';
const categoriesSchema=new Schema({
name:String
});
export const validCategories=Joi.object({
    name:Joi.string().required().min(3).max(18)})

const categories=model('categories', categoriesSchema);

export default  categories;
export {categoriesSchema};
