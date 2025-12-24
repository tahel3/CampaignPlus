import { Router } from "express";
import campaigns from '../models/campaign.models.js';
import { isValidObjectId } from "mongoose";
// import Joi from 'joi'; // דוגמה לספריית אימות נתונים
import { validCampaign } from "../models/campaign.models.js";

const router = Router();

// // הגדרת סכימת אימות לנתוני הקמפיין
// const campaignSchema = Joi.object({
//     name: Joi.string().required(),
//     dest: Joi.number().min(0).required(),
//     status: Joi.boolean(),
//     dateStart: Joi.date(),
//     dateEnd: Joi.date(),
//     description: Joi.string(),
//     sumCon: Joi.number().min(0).default(0),
//     isOpen: Joi.boolean().default(true),
//     img: Joi.string().allow(null, '') 
// });
router.get('/active-count', async (req, res) => {
    try {
        const activeCampaigns = await campaigns.countDocuments({ isOpen: true, dateEnd: { $gte: new Date() } });
        res.json({ count: activeCampaigns });
    } catch (err) {
        res.status(500).json({ message: "Failed to get active campaign count" });
    }
});
router.get('/', async (req, res) => {
    try {
         const campaignsWithSums = await campaigns.aggregate([
            {
                $lookup: {
                    from: 'contributions', 
                    localField: '_id',
                    foreignField: 'campaign',
                    as: 'donations'
                }
            },
            {
                $addFields: {
                    sumCon: {
                        $sum: '$donations.amount' 
                    }
                }
            },
            {
                $project: {
                    donations: 0 // מסיר את מערך התרומות המלא מהתשובה הסופית
                }
            }
        ]);
        console.log('Successfully retrieved campaigns with calculated sums');
        res.status(200).json(campaignsWithSums);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ message: "Failed to retrieve campaigns" });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(404).json({ message: 'Not a valid ID' });
        }
        const campaign = await campaigns.findById(id) .populate({
            path: 'contribution.user',
            select: '_id userName'  
          });;
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }
        console.log('you get campaign by id');
        res.status(200).json(campaign);
    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({ message: "Failed to retrieve campaign" });
    }
});

router.post('/', async (req, res) => {
    const { error } = validCampaign.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    console.log("Incoming:", req.body);
    try {
        const newCampaign = new campaigns(req.body);
        await newCampaign.save();
        res.status(201).json(newCampaign);
    } catch (error) {
        console.error('Error adding campaign:', error);
        res.status(400).json({ message: "Failed to add campaign", error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(404).json({ message: "Not a valid ID" });
        }
        const campaign = await campaigns.findByIdAndDelete(id);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }
        res.status(204).end(); // No content to send
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({ message: "Failed to delete campaign", error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(404).json({ message: "Not a valid ID" });
        }
        const campaign = await campaigns.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }
        res.status(200).json(campaign);
    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(500).json({ message: "Failed to update campaign", error: error.message });
    }
});

export default router;