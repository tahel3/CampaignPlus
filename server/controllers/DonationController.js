import Donation from '../models/contribution.models.js';
import mongoose from 'mongoose';

export const getDonationStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);


        // 1. סכום כולל
        const totalOverallResult = await Donation.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalOverall = totalOverallResult.length > 0 ? totalOverallResult[0].total : 0;
        // 2. סכום שבועי 
        const totalWeeklyResult = await Donation.aggregate([
            { $match: { dateCon: { $gte: startOfWeek } } }, // השתמש ב-dateCon במקום createdAt
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // 3. סכום יומי 
        const totalTodayResult = await Donation.aggregate([
            { $match: { dateCon: { $gte: startOfDay } } }, // השתמש ב-dateCon במקום createdAt
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // 4. נתונים למגמה שבועית
        const weeklyTrend = await Donation.aggregate([
            { $match: { dateCon: { $gte: startOfWeek } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$dateCon" } },
                    amount: { $sum: "$amount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
        const totalWeekly = totalWeeklyResult.length > 0 ? totalWeeklyResult[0].total : 0;
        const totalToday = totalTodayResult.length > 0 ? totalTodayResult[0].total : 0;
        // 5. תורמים מובילים
        const topDonors = await Donation.aggregate([
            { $match: { user: { $ne: null } } },
            {
                $group: {
                    _id: "$user", 
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id', 
                    foreignField: '_id',
                    as: 'donorDetails'
                }
            },
            {
                $project: {
                    _id: 0,
                    donorId: '$_id',
                    totalAmount: 1,
                    count: 1,
                    userName: { $arrayElemAt: ['$donorDetails.userName', 0] }
                }
            }
        ]);

        res.status(200).json({
            totalOverall: totalOverall,
            totalWeekly: totalWeekly,
            totalToday: totalToday,
            weeklyTrend: weeklyTrend.map(item => ({ date: item._id, amount: item.amount })),
            topDonors: topDonors
        });

    } catch (error) {
        console.error("Error fetching donation stats:", error);
        res.status(500).json({ message: "שגיאה בשרת במהלך שליפת הנתונים" });
    }
};
