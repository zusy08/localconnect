# Setup Instructions for LocalConnect

## Prerequisites
Before you begin, ensure you have the following software installed:
- Node.js (version X.X.X or higher)
- npm (Node Package Manager)
- MongoDB (version X.X.X or higher)

## Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/zusy08/LocalConnect.git
   ```
2. Navigate into the project directory:
   ```bash
   cd LocalConnect
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```

## Environment Configuration
1. Create a `.env` file in the root directory of the project.
2. Add the following environment variables:
   ```ini
   DB_URI=mongodb://localhost:27017/localconnect
   PORT=3000
   ```

## Database Setup
1. Start MongoDB server:
   ```bash
   mongod
   ```
2. Optionally, create a database named `localconnect`:
   ```bash
   mongo
   use localconnect
   ````

## Running the Application
1. Start the application:
   ```bash
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000`.

## Troubleshooting Guide
- If you encounter issues with dependencies, try running:
   ```bash
   npm install --force
   ```
- Check MongoDB logs for connection issues.
- Ensure your Node.js version is compatible by checking with:
   ```bash
   node -v
   ```

For further assistance, refer to the issues section on GitHub or contact support.