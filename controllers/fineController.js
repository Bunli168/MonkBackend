const { User, UserProfile, Attendance, Payment, RetreatEvent, Kut, SeatingRow } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

exports.getUnpaidFines = async (req, res) => {
    try {
        // Fetch active year
        const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
        const activeYearId = activeYear ? activeYear.id : null;
        
        const attendanceWhere = activeYearId ? { retreat_event_id: activeYearId, status: { [Op.in]: ['absent', 'permission'] } } : { status: { [Op.in]: ['absent', 'permission'] } };
        const paymentWhere = activeYearId ? { retreat_event_id: activeYearId } : {};

        // Find all monks with role 'Monk' or 'Bhikkhu' or 'Samanera' (anyone who can have attendance)
        const monks = await User.findAll({
            include: [
                {
                    model: UserProfile,
                    attributes: ['first_name_kh', 'last_name_kh', 'chhaya_number', 'phone_number', 'seat_number'],
                    include: [
                        { model: Kut, attributes: ['name'] },
                        { model: SeatingRow, attributes: ['row_num'] }
                    ]
                },
                {
                    model: Attendance,
                    attributes: ['status'],
                    where: attendanceWhere,
                    required: false
                },
                {
                    model: Payment,
                    attributes: ['amount_paid'],
                    where: paymentWhere,
                    required: false
                }
            ],
            where: {
                role_id: { [Op.in]: [2, 3] }
            }
        });

        const unpaidFines = monks.map(monk => {
            let totalAbsent = 0;
            let totalPermission = 0;

            if (monk.Attendances) {
                monk.Attendances.forEach(att => {
                    if (att.status === 'absent') totalAbsent++;
                    if (att.status === 'permission') totalPermission++;
                });
            }

            const effectiveAbsents = totalAbsent + Math.floor(totalPermission / 3);
            const grossFine = Math.floor(effectiveAbsents / 3) * 5;
            
            let totalPaid = 0;
            if (monk.Payments) {
                totalPaid = monk.Payments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);
            }

            let netFine = grossFine - totalPaid;
            if (netFine < 0) netFine = 0;

            // Compute cleared absents by mapping $5 -> 3 absents
            const clearedAbsents = Math.floor(totalPaid / 5) * 3;
            const netAbsents = effectiveAbsents - clearedAbsents;

            return {
                id: monk.id,
                fullName: monk.UserProfile ? `${monk.UserProfile.first_name_kh} ${monk.UserProfile.last_name_kh}` : 'Unknown',
                chhaya_number: monk.UserProfile ? monk.UserProfile.chhaya_number : null,
                phone: monk.UserProfile ? monk.UserProfile.phone_number : null,
                kudiNumber: monk.UserProfile && monk.UserProfile.Kut ? monk.UserProfile.Kut.name : null,
                rowNumber: monk.UserProfile && monk.UserProfile.SeatingRow ? monk.UserProfile.SeatingRow.row_num : null,
                seatNumber: monk.UserProfile ? monk.UserProfile.seat_number : null,
                totalAbsent,
                totalPermission,
                grossAbsents: effectiveAbsents,
                clearedAbsents,
                netAbsents: netAbsents > 0 ? netAbsents : 0,
                fineOwed: netFine
            };
        }).filter(m => m.grossAbsents >= 9 && m.fineOwed > 0); // Only show those with 9+ gross absents AND who still owe a fine

        res.json({ success: true, data: unpaidFines });
    } catch (error) {
        console.error('Error fetching unpaid fines:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.payFine = async (req, res) => {
    // Keep this or route to ledgerController. Since this is /fines/:id/pay and they use ledger/pay, this might be unused, but let's keep it safe.
    try {
        const { user_id } = req.body;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Missing user_id' });
        }
        const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
        const payment = await Payment.create({
            user_id,
            amount_paid: 5.00,
            retreat_event_id: activeYear ? activeYear.id : null,
            paid_at: new Date()
        });
        res.json({ success: true, data: payment, message: 'Fine paid successfully' });
    } catch (error) {
        console.error('Error paying fine:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPaymentReport = async (req, res) => {
    try {
        const { retreat_event_id } = req.query;
        let activeYearId = retreat_event_id;
        if (!activeYearId) {
            const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
            activeYearId = activeYear ? activeYear.id : null;
        }
        const paymentWhere = activeYearId ? { retreat_event_id: activeYearId } : {};

        const payments = await Payment.findAll({
            where: paymentWhere,
            include: [
                {
                    model: User,
                    attributes: ['id'],
                    include: [{ model: UserProfile, attributes: ['first_name_kh', 'last_name_kh'] }]
                },
                {
                    model: User,
                    as: 'Collector',
                    attributes: ['id'],
                    include: [{ model: UserProfile, attributes: ['first_name_kh', 'last_name_kh'] }]
                }
            ],
            order: [['paid_at', 'DESC']]
        });

        const formatted = payments.map(p => ({
            id: p.id,
            amount: parseFloat(p.amount_paid),
            cleared_absents: Math.floor(parseFloat(p.amount_paid) / 5) * 3, // $5 = 3 absents
            payment_date: p.paid_at || p.createdAt,
            payer_name: p.User && p.User.UserProfile ? `${p.User.UserProfile.first_name_kh} ${p.User.UserProfile.last_name_kh}` : 'Unknown',
            collector_name: p.Collector && p.Collector.UserProfile ? `${p.Collector.UserProfile.first_name_kh} ${p.Collector.UserProfile.last_name_kh}` : 'Unknown'
        }));

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Error fetching payment report:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
