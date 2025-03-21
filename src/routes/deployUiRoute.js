const express = require('express');
const { deployUi } = require('./deployUi');
const router = express.Router();

router.post('/deploy/ui', async (req, res) => {
    try {
        const deployResponse = await deployUi();
        res.status(200).json({ message: 'UI deployed successfully!', output: deployResponse });
    } catch (error) {
        console.error('Error deploying UI:', error);
        res.status(500).json({ error: 'Failed to deploy UI', details: error.details || error.message || 'Unknown error' });
    }
});

module.exports = router;