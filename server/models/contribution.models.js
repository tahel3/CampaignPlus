import Joi from 'joi';
import mongoose from 'mongoose';
import { campaignSchema } from './campaign.models.js';
import { usersSchema } from './user.models.js';

const contributionsSchema = new mongoose.Schema({
    dedication: {
        type: String,
        maxlength: 30
    },
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'campaigns',
        required: true
    },
      anonymous: { 
        type: Boolean,
        default: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    dateCon: {
        type: Date,
        default: Date.now
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    }
});

export const validContribution = Joi.object({
    dedication: Joi.string().max(30).optional(),
    campaign: Joi.string().required(), 
    amount: Joi.number().min(1).required(),
    user: Joi.string().optional(),
    anonymous: Joi.boolean().optional()
}).xor('user', 'anonymous');

const Contributions = mongoose.model('contributions', contributionsSchema);

export default Contributions;
export { contributionsSchema };