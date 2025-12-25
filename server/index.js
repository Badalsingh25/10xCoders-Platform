const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/todos', require('./routes/todoRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Welcome route
app.get('/', (req, res) => {
  res.send('Welcome to the Todo API');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server connected and listening on port ${PORT}`);
}); 