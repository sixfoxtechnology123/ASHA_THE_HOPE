const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 1. SEED FUNCTION (Keep this to ensure 'asha' is hashed in DB)
exports.seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ username: 'asha' });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('asha123', salt);

            await User.create({
                username: 'asha',
                password: hashedPassword,
                role: 'Admin'
            });
            console.log('👤 Admin "asha" stored with HASH in DB');
        }
    } catch (err) {
        console.error('❌ Seed Error:', err.message);
    }
};

// 2. LOGIN FUNCTION (Specific Error Messages)
exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Step A: Find the user by ID (username)
        const user = await User.findOne({ username });

        // IF USER DOES NOT EXIST
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid User ID" 
            });
        }

        // Step B: User exists, now check the Password
        const isMatch = await bcrypt.compare(password, user.password);
        
        // IF PASSWORD IS WRONG
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid Password" 
            });
        }

        // Step C: Everything is correct
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET || 'asha_secret', 
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: "Successfully Login", // Your specific success message
            token,
            user: { username: user.username, role: user.role }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};