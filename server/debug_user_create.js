const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const User = require('./models/userModel');

dotenv.config();

const testUserCreation = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${mongoose.connection.host}`.cyan.underline);

        const email = `testuser_${Date.now()}@example.com`;
        const password = 'password123';
        const name = 'Test User';

        console.log(`Attempting to create user: ${email}`);

        const user = await User.create({
            name,
            email,
            password
        });

        console.log('User created successfully:', user._id);
        console.log('Test PASSED.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating user:', error);
        console.log('Test FAILED.');
        process.exit(1);
    }
};

testUserCreation();
