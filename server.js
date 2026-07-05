const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from 'public' folder

// Configuration - REPLACE THESE
const API_KEY = process.env.LIPILA_API_KEY; // REPLACE: Your Lipila API key
const BASE_URL = process.env.LIPILA_BASE_URL || 'https://api.lipila.dev/api/v1/collections/mobile-money';

// Serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Payment endpoint - POST method
app.post('/api/pay', async (req, res) => {
    console.log('Payment request received:', req.body);
    
    try {
        // Get values from request body or use defaults
        const {
            amount = 1,
            accountNumber = '260972643310',
            narration = 'payment for bread',
            email = 'customer@example.com',
            callbackUrl = 'https://kato-zero.github.io/payment-platform-exercise/', // REPLACE: Your domain
            redirectUrl = 'https://kato-zero.github.io/payment-platform-exercise/',  // REPLACE: Your domain
            backUrl = 'https://kato-zero.github.io/payment-platform-exercise/'          // REPLACE: Your domain
        } = req.body;

        // Validate required fields
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Amount is required and must be greater than 0'
            });
        }

        if (!accountNumber) {
            return res.status(400).json({
                success: false,
                error: 'Account number is required'
            });
        }

        // Generate unique reference ID
        const referenceId = uuidv4();

        // Prepare the payload
        const payload = {
            callbackUrl: callbackUrl,
            referenceId: referenceId,
            amount: parseFloat(amount),
            narration: narration,
            accountNumber: accountNumber,
            currency: 'ZMW',
            backUrl: backUrl,
            redirectUrl: redirectUrl,
            email: email
        };

        console.log('Sending payload to Lipila:', payload);

        // Make the API call to Lipila
        const response = await axios.post(
            `${BASE_URL}/collections/mobile-money`,
            payload,
            {
                headers: {
                    'accept': 'application/json',
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Lipila response:', response.data);

        // Return success response
        res.json({
            success: true,
            data: response.data,
            referenceId: referenceId,
            message: 'Payment initiated successfully'
        });

    } catch (error) {
        console.error('Payment error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        // Return detailed error
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.message || error.message,
            details: error.response?.data || null
        });
    }
});

// Callback endpoint - Lipila sends payment status here
app.post('/callback', async (req, res) => {
    try {
        const callbackData = req.body;
        console.log('Payment callback received:', callbackData);

        // REPLACE: Add your database logic here
        // Example: Update payment status in your database
        // await db.collection('payments').updateOne(
        //     { referenceId: callbackData.referenceId },
        //     { $set: { status: callbackData.status, updatedAt: new Date() } }
        // );

        // Always respond with 200 to acknowledge
        res.status(200).json({ status: 'received' });
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).json({ error: 'Error processing callback' });
    }
});

// Check payment status endpoint
app.get('/api/payment-status/:referenceId', async (req, res) => {
    try {
        const { referenceId } = req.params;
        
        // REPLACE: Get status from your database
        // For demo, return mock status
        res.json({
            referenceId: referenceId,
            status: 'pending',
            message: 'Payment status retrieved'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get payment status'
        });
    }
});

// Handle favicon request (to avoid 404)
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Payment server running on http://localhost:${PORT}`);
    console.log(`📝 Open http://localhost:${PORT} in your browser`);
});
