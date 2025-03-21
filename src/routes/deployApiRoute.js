const express = require('express');
const { deployNodeApi } = require('./deployApi');
const router = express.Router();

router.post('/deploy/nodeapi', async (req, res) => {
    const { mongodbUri } = req.body;

    if (!mongodbUri) {
        return res.status(400).json({ error: 'Missing required field: mongodbUri' });
    }

    try {
        const deployResponse = await deployNodeApi(mongodbUri);
        res.status(200).json({ message: 'Node.js API deployed successfully!', output: deployResponse });
    } catch (error) {
        console.error('Error deploying Node.js API:', error);
        res.status(500).json({ error: 'Failed to deploy Node.js API', details: error.details });
    }
});

module.exports = router;