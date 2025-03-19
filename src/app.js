const express = require('express');
const dotenv = require('dotenv');
const onboardRoute = require('./routes/onboard');
const deployRoute = require('./routes/deployApi');
const deployUiRouter = require('./routes/deployUi');
const deployApiRouter = require('./routes/deployApiRoute');



dotenv.config();
console.log('ATLAS_PUBLIC_KEY:', process.env.ATLAS_PUBLIC_KEY);
console.log('ATLAS_PRIVATE_KEY:', process.env.ATLAS_PRIVATE_KEY);
console.log('ATLAS_PROJECT_ID:', process.env.ATLAS_PROJECT_ID);

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/onboard', onboardRoute);
//app.use('/deploy', deployRoute);
//app.use('/deploy', deployUiRouter);
app.use('/api', deployApiRouter);


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});