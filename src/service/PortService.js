const { MongoClient, ObjectId } = require('mongodb');
const Port = require('../models/Port');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

class PortService {
    constructor() {
        this.mongodbUri = process.env.MONGODB_URI;
        this.client = new MongoClient(this.mongodbUri, { useNewUrlParser: true });
    }

    async connect() {
        await this.client.connect();
        this.db = this.client.db('test'); // Replace with your database name
        this.collection = this.db.collection('ports');
    }

    async getPortValues(createNew = false) {
        await this.connect();
        let latestPortValues = await this.collection.findOne({}, { sort: { timestamp: -1 } });

        if (!latestPortValues && createNew) {
            // Create a new record with default values if no record exists and createNew is true
            latestPortValues = {
                _id: new ObjectId(),
                apiPort: 3000,
                uiPort: null,
                appName: 'nodeadminapi0',
                uiName: null,
                timestamp: new Date()
            };

            // Insert the new record
            await this.collection.insertOne(latestPortValues);
        } else if (latestPortValues && createNew) {
            // Increment the port values and appName for each subsequent call
            let appNameNumber = 1;
            if (latestPortValues.appName) {
                appNameNumber = parseInt(latestPortValues.appName.replace('nodeadminapi', '')) + 1;
            }
            latestPortValues = {
                _id: new ObjectId(),
                apiPort: latestPortValues.apiPort + 1,
                uiPort: null,
                appName: `nodeadminapi${appNameNumber}`,
                uiName: null,
                timestamp: new Date()
            };

            // Insert the new record
            await this.collection.insertOne(latestPortValues);
        }

        await this.client.close();
        console.log('Port values:', latestPortValues);
        return new Port(latestPortValues.apiPort, latestPortValues.uiPort, latestPortValues.appName, latestPortValues.uiName, latestPortValues.timestamp);
    }

    async updateUiPort(apiPort) {
        await this.connect();
        let latestPortValues = await this.collection.findOne({ apiPort: apiPort });

        if (latestPortValues) {
            let uiPortNumber = 4000;
            if (latestPortValues.uiPort !== null) {
                uiPortNumber = latestPortValues.uiPort + 1;
            } else {
                // Find the latest uiPort value in the collection
                const latestUiPortValue = await this.collection.findOne({}, { sort: { uiPort: -1 } });
                if (latestUiPortValue && latestUiPortValue.uiPort !== null) {
                    uiPortNumber = latestUiPortValue.uiPort + 1;
                }
            }
            latestPortValues.uiPort = uiPortNumber;
            latestPortValues.uiName = `admin-web${uiPortNumber - 4000}`;

            // Update the record with the new uiPort and uiName
            await this.collection.updateOne({ _id: latestPortValues._id }, { $set: { uiPort: latestPortValues.uiPort, uiName: latestPortValues.uiName } });

            await this.client.close();
            console.log('Updated Port values:', latestPortValues);
            return new Port(latestPortValues.apiPort, latestPortValues.uiPort, latestPortValues.appName, latestPortValues.uiName, latestPortValues.timestamp);
        } else {
            await this.client.close();
            throw new Error(`No matching document found for apiPort: ${apiPort}`);
        }
    }
}

module.exports = PortService;