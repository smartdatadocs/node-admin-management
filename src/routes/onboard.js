const express = require('express');
const axios = require('axios');
const router = express.Router();
const { deployNodeApi } = require('./deployApi');
const { deployUi } = require('./deployUi');

router.post('/mongodbApiUi', async (req, res) => {
    const { username, password, clusterName } = req.body;

    if (!username || !password || !clusterName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const publicKey = process.env.ATLAS_PUBLIC_KEY;
    const privateKey = process.env.ATLAS_PRIVATE_KEY;
    const projectId = process.env.ATLAS_PROJECT_ID;

    // Dynamically import DigestFetch
    const { default: DigestFetch } = await import('digest-fetch');

    const client = new DigestFetch(publicKey, privateKey, { algorithm: 'MD5' });

    const clusterConfig = {
        name: clusterName,
        providerSettings: {
            providerName: 'AWS',
            instanceSizeName: 'M10', // M10 for the specified cluster type
            regionName: 'US_EAST_1' // Default region
        },
        clusterType: 'REPLICASET'
    };

    try {
        // Create the MongoDB cluster
        const clusterResponse = await client.fetch(
            `https://cloud.mongodb.com/api/atlas/v1.0/groups/${projectId}/clusters`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(clusterConfig)
            }
        );

        const clusterData = await clusterResponse.json();

        if (!clusterResponse.ok) {
            console.error('MongoDB Atlas API Error:', clusterData);
            throw new Error(`Cluster creation failed with status ${clusterResponse.status}`);
        }

        // Create the database user
        const userConfig = {
            username: username,
            password: password,
            databaseName: 'admin', // default database where the user is created
            roles: [
                {
                    roleName: 'readWriteAnyDatabase',
                    databaseName: 'admin', // specify the cluster database for user
                }
            ]
        };

        const userResponse = await client.fetch(
            `https://cloud.mongodb.com/api/atlas/v1.0/groups/${projectId}/databaseUsers`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userConfig)
            }
        );

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            console.error('MongoDB Atlas API Error:', userData);
            throw new Error(`User creation failed with status ${userResponse.status}`);
        }

        // Polling mechanism to check the cluster status
        const pollClusterStatus = async () => {
            const clusterStatusResponse = await client.fetch(
                `https://cloud.mongodb.com/api/atlas/v1.0/groups/${projectId}/clusters/${clusterName}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const statusData = await clusterStatusResponse.json();
            const clusterStatus = statusData.stateName;

            if (clusterStatus === 'IDLE' || clusterStatus === 'AVAILABLE') {
                // Cluster is available, retrieve the connection string
                if (statusData.connectionStrings && statusData.connectionStrings.standardSrv) {
                    const clusterUri = `mongodb+srv://${username}:${password}@${statusData.connectionStrings.standardSrv.split('//')[1]}/?retryWrites=true&w=majority&appName=${clusterName}`;
                    console.log('Cluster is available and connected', clusterUri);
                    // Call the deployNodeApi function with the clusterUri
                    try {
                        const deployResponse = await deployNodeApi(clusterUri);
                        console.log('Node.js API deployed successfully:', deployResponse);

                        // Call the deployUi function
                        const uiDeployResponse = await deployUi();
                        console.log('UI deployed successfully:', uiDeployResponse);

                        res.status(200).json({ message: 'Cluster is available, connected & Deployed API and UI code', uri: clusterUri, deployResponse, uiDeployResponse });
                    } catch (deployError) {
                        console.error('Error deploying node API or UI:', deployError.details);
                        res.status(500).json({ error: 'Failed to deploy node API or UI', details: deployError.details });
                    }
                } else {
                    // If the connection string is missing or not yet available
                    res.status(500).json({ error: 'Connection string not available yet.' });
                }
            } else {
                // Continue polling if the cluster is not yet ready
                setTimeout(pollClusterStatus, 60000); // Poll every 1 minute
            }
        };

        // Start polling
        pollClusterStatus();

    } catch (error) {
        console.error('Error creating MongoDB cluster:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            error: 'Failed to create the new MongoDB cluster or retrieve connection string',
            details: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;