import {model, Schema} from 'mongoose'
import Joi from 'joi';
import {categoriesSchema} from './categories.models.js';
import {contributionsSchema} from './contribution.models.js';
const campaignSchema=new Schema({
    name: {
        type: String,
        required: [true, 'Campaign name is required'],
        trim: true,
        unique: true 
    },
    dateStart:Date,
    dateEnd:Date,
    contribution:[contributionsSchema],
    category: [{ 
        type: Schema.Types.ObjectId,
        ref: 'categories' 
    }],
    dest: Number,
    sumCon: {
        type: Number,
        default: 0, 
        required: true 
    },
    img:String,
    isFinal:Boolean,
    isOpen:Boolean,
    description:String
});
export const validCampaign = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    dateStart: Joi.date().greater('now').required(),
    dateEnd: Joi.date().greater(Joi.ref('dateStart')).required(),
    description: Joi.string().max(3000),
  dest: Joi.number().min(1).required(),
});

const campaigns=model('campaigns',campaignSchema);
export default campaigns;
export {campaignSchema};

