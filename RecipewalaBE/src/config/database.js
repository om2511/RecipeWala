const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                logger.info('MongoDB connection closed due to app termination');
                process.exit(0);
            } catch (err) {
                logger.error('Error during MongoDB disconnect:', err);
                process.exit(1);
            }
        });

    } catch (error) {
        logger.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
