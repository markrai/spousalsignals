# spousalsignals
a dashboard for husband and wife to see each other's current stress levels based on Fitbit HRV data

![image](https://github.com/user-attachments/assets/d9a5a306-8714-4c4d-84d2-389813391686)

# Installation

Installation Instructions

### 1. Prerequisites
Before you begin, ensure you have the following installed:
Node.js (version 12.x or later)
npm (Node Package Manager, comes with Node.js)

### 2. Create Applications on Fitbit Developer Portal

To use this app, you need to create two separate applications on the Fitbit Developer Portal. Each application corresponds to a different user - presumably you, and your significant other.

Go to https://dev.fitbit.com/apps and log in with your Fitbit account.

Create the First Application (User 1):
Click on Create App.
Fill in the required details:
App Name: This can be anything.
OAuth 2.0 Application Type: Set to Personal.
Callback URL: Set to https://127.0.0.1/callback/user1 (This will vary depending on where you intend to host this)
Default Access Type: Set to Read-Only.
Note down the Client ID and Client Secret.

Create the Second Application (User 2):
Repeat the same steps as above, but set the Callback URL to https://s/callback/user2 (will vary depending on where you host it)
Note down the Client ID and Client Secret for User 2.

### 3. Configure the Application

Install the necessary dependencies:

Set Up Credentials:

Open the server.js file and replace the placeholder Fitbit credentials with the ones you obtained from the Fitbit Developer Portal.

### 4. Run the Application
Once you've configured the credentials, you can run the application by executing:

node server.js
This command will start the server, and your app will be accessible via your browser.

### 5. Authenticate with Fitbit
When you start the server, visit the following URLs in your browser to authenticate each user:

User 1: http://127.0.0.1:8080/login/user1
User 2: http://127.0.0.1:8080/login/user2

Follow the prompts to log in to Fitbit and authorize the application. Upon successful authentication, the tokens will be stored, and the app will start fetching HRV data from Fitbit.

### 6. Access the Data
After authentication, you can access the HRV data by visiting:
http://localhost:8080/
This will display the HRV data for both users.
