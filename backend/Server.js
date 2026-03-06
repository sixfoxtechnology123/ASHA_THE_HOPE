const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { seedAdmin } = require('./controllers/authController');
const specializationRoutes = require('./routes/specializationRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const doctorScheduleRoutes = require('./routes/doctorScheduleRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/master', specializationRoutes);
app.use('/api/master/department', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/doctor-schedules', doctorScheduleRoutes);
app.use('/api/appointments', appointmentRoutes);

// DB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/asha_hope')
    .then(async () => {
        console.log('✅ MongoDB Connected');
        await seedAdmin(); // Runs the hashing logic immediately
    })
    .catch(err => console.log('❌ DB Connection Error:', err));

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
