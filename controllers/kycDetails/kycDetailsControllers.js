const PanDetail = require('../../models/kyc/KycDetails');
const User = require('../../models/user/User');

exports.createPanDetail = async (req, res) => {
    try {
        const { pan, name, dateOfBirth } = req.body;
        const userId = req.user._id;

        const newPanDetail = new PanDetail({
            userId,
            pan,
            name,
            dateOfBirth
        });

        await newPanDetail.save();

        await User.findByIdAndUpdate(userId, { isPanVerified: true });

        res.status(201).json({ message: 'PAN detail created successfully', panDetail: newPanDetail });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
