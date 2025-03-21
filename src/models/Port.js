class Port {
    constructor(apiPort, uiPort, appName, uiName, timestamp) {
        this.apiPort = apiPort;
        this.uiPort = uiPort;
        this.appName = appName;
        this.uiName = uiName;
        this.timestamp = timestamp;
    }
}

module.exports = Port;