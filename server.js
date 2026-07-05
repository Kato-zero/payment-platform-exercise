const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

// Configuration - REPLACE THESE WITH YOUR ACTUAL VALUES
const API_KEY = process.env.LIPILA_API_KEY; // REPLACE: Get from Lipila dashboard
const BASE_URL = process.env.LIPILA_BASE_URL;

// Payment endpoint
app.post('/api/pay', async (req, res) => {
    try {
        // REPLACE: These should come from your frontend or request body
        const {
            amount = 1,                    // REPLACE: Get from user input
            accountNumber = '260972643310', // REPLACE: Customer's mobile number
            narration = 'payment for bread', // REPLACE: Description
            email = 'customer@email.com',   // REPLACE: Customer's email
            callbackUrl = 'https://your-domain.com/callback', // REPLACE: Your callback URL
            redirectUrl = 'https://your-domain.com/success',  // REPLACE: Success redirect
            backUrl = 'https://your-domain.com/back'          // REPLACE: Back button URL
        } = req.body;

        // Generate unique reference ID
        const referenceId = uuidv4();

        // Prepare the request payload
        const payload = {
            callbackUrl: callbackUrl,
            referenceId: referenceId,
            amount: amount,
            narration: narration,
            accountNumber: accountNumber,
            currency: 'ZMW',
            backUrl: backUrl,
            redirectUrl: redirectUrl,
            email: email
        };

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

        // Return success response
        res.json({
            success: true,
            data: response.data,
            referenceId: referenceId
        });

    } catch (error) {
        console.error('Payment error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

// Callback endpoint - Lipila will send payment status here
app.post('/callback', async (req, res) => {
    try {
        // REPLACE: Process the payment callback from Lipila
        const callbackData = req.body;
        console.log('Payment callback received:', callbackData);

        // REPLACE: Update your database with payment status
        // Example: 
        // await db.updatePaymentStatus(callbackData.referenceId, callbackData.status);

        // Always respond with 200 to acknowledge receipt
        res.status(200).send('OK');
    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).send('Error processing callback');
    }
});

// Check payment status endpoint
app.get('/api/payment-status/:referenceId', async (req, res) => {
    try {
        const { referenceId } = req.params;
        
        // REPLACE: Check status from your database
        // For now, we'll return a mock response
        res.json({
            referenceId: referenceId,
            status: 'pending', // REPLACE: Get from database
            message: 'Payment status retrieved'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get payment status'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Payment server running on port ${PORT}`);
});