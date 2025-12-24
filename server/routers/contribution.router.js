import { Router } from "express";
import contributions, { validContribution } from "../models/contribution.models.js";
import Campaign from "../models/campaign.models.js";
import { isValidObjectId } from 'mongoose';
import { io } from '../app.js';
import { getDonationStats } from "../controllers/DonationController.js";

const router = Router();

router.get('/stats',getDonationStats);

router.get('/', async (req, res) => {
    try {
        const allContribution = await contributions
        .find({})
        .populate('campaign'); 
        console.log('you get contribution');
        res.status(200).json(allContribution);
    }
    catch (error) {
        console.error('Error fetching contributions:', error);
        res.status(500).json({ message: "Failed to retrieve contributions" });
    }
});
router.get('/campaigns/:campaignId', async (req, res) => {
    try {
        const { campaignId } = req.params;

        if (!isValidObjectId(campaignId)) {
            return res.status(400).json({ message: 'Invalid campaign ID.' });
        }

        // 1. שולפים את התרומות עבור ה-ID הספציפי של הקמפיין.
        // 2. משתמשים ב-populate כדי לשלוף את שם המשתמש (אם קיים)
        // הנחה: שדה ה-user הוא הפנייה למודל המשתמשים. אם ה-ID לא קיים, הוא יישאר null.
        const campaignContributions = await contributions.find({ campaign: campaignId })
            .populate({
                path: 'user', // השדה המפנה למשתמש
                select: 'userName', // השדות שאנו רוצים לשלוף
                options: { strictPopulate: false } // מאפשר להתעלם אם אין שדה user
            })
            .sort({ dateCon: -1 }); // מציג את התרומות מהחדשה לישנה

        const formattedContributions = campaignContributions.map(con => ({
            __id: con._id,
            amount: con.amount,
            dateCon: con.dateCon,
            donorName: con.user ? con.user.userName : con.donorName || 'אנונימי',
            anonymous: !con.user
        }));

        res.status(200).json(formattedContributions);
    } catch (error) {
        console.error('Error fetching campaign contributions:', error);
        res.status(500).json({ message: "Failed to retrieve contributions for this campaign." });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id))
            return res.status(404).json({ error: { message: 'not valid id' } });
        const Contribution = await contributions.findById(id);
        console.log('you get contribution by id');
        res.status(200).json(Contribution);
    }
    catch (error) {
        console.error('Error fetching contributions:', error);
        res.status(500).json({ message: "Failed to retrieve contributions" });
    }
});
router.post('/', async (req, res, next) => {

    const { error } = validContribution.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const { campaign: campaignId, amount } = req.body; 
    try {
        const newContribution = new contributions(req.body);
        await newContribution.save();

        const updatedCampaign = await Campaign.findByIdAndUpdate(
            campaignId,
            { $inc: { sumCon: amount } }, 
            { new: true, select: 'sumCon dest' }
        );

        if (updatedCampaign) {
            // 4. שליחת עדכון Socket.io לכל הלקוחות
            io.emit('donationUpdate', {
                campaignId: updatedCampaign._id,
                newSum: updatedCampaign.sumCon,
                newDest: updatedCampaign.dest,
                amount: amount 
            });
            console.log(`Socket.io emitted update for Campaign ID: ${updatedCampaign._id}`);
            console.log("Socket update emitted successfully.");
        }
        res.status(201).json(newContribution);
    }
    catch (error) {
        console.error('Error saving new contribution and updating campaign:', error);
        res.status(400).json({ message: "Failed to add contribution or update campaign" });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id))
            return res.status(404).json({ message: "not valid id" });
        const contribution = await contributions.findByIdAndDelete(id);
        if (!contribution) {
            return res.status(404).json({ message: "Campaign not found" });
        }
        res.status(204).end();
    }
    catch (error) {
        res.status(500).json(error);
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id))
            return res.status(404).json({ message: "not valid id" });
        const contribution = await contributions.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
        if (!contribution)
            res.status(404).json({ error: { massage: 'contribution not found' } })
        else
            res.status(200).json(contribution);
    }
    catch (error) {
        res.status(500).json(error);
    }
});

export default router;