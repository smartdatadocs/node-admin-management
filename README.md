# NodeAdminAPI

NodeAdminAPI is a simple Node.js application that connects to a MongoDB cluster and provides APIs for inserting and retrieving data. This project uses Express for the server framework and Mongoose for interacting with the MongoDB database.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd NodeAdminAPI
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your MongoDB connection string:
   ```
   MONGODB_URI=<your_mongodb_connection_string>
   ```

## Usage

To start the application, run the following command:
```
npm start
```

The server will start on `http://localhost:3000`.

## API Endpoints

### Insert Data

- **Endpoint:** `POST /data`
- **Description:** Inserts data into the MongoDB database.
- **Request Body:**
  ```json
  {
    "field1": "value1",
    "field2": "value2"
  }
  ```

### Get Data

- **Endpoint:** `GET /data`
- **Description:** Retrieves data from the MongoDB database.
- **Response:**
  ```json
  [
    {
      "field1": "value1",
      "field2": "value2"
    },
    ...
  ]
  ```

## License

This project is licensed under the MIT License.