import express from 'express';
import pkg from 'pg';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import cookie from 'cookie'; // ⬅️ Correct location for import
import dotenv from 'dotenv';
dotenv.config();
const password = process.env.PASSWORD;

process.on('unhandledRejection', (err) => {
  console.error('🔥 Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

const app = express();
const port = 3000;
const { Pool } = pkg;

// Middleware to log requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

const allowedOrigins = ['http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
  origin: function(origin, callback){
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: process.env.PASSWORD,  
  port: 5432,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// CHECK CREDENTIALS
app.get('/api/checkcredentials', async (req, res) => {
  const { username, email } = req.query;

  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }

  try {
    const usernameCheck = await pool.query(
      'SELECT 1 FROM accountData WHERE username = $1 LIMIT 1',
      [username]
    );
    const isUsernameInUse = usernameCheck.rowCount > 0;

    const emailCheck = await pool.query(
      'SELECT 1 FROM accountData WHERE email = $1 LIMIT 1',
      [email]
    );
    const isEmailInUse = emailCheck.rowCount > 0;

    return res.json({ isUsernameInUse, isEmailInUse });
  } catch (err) {
    console.error('Error during credential check:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

// CREATE ACCOUNT
app.post('/api/createaccount', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    console.log('Received create account request for:', username, email);

    // Hash the password properly
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword);

    // Verify the column name matches your database
    const insertQuery = `
      INSERT INTO accountData (username, email, password)  // Make sure 'password' matches your column name
      VALUES ($1, $2, $3)
      RETURNING username, email
    `;
    
    console.log('Executing query:', insertQuery, 'with params:', [username, email, hashedPassword]);
    
    const insertResult = await pool.query(insertQuery, [username, email, hashedPassword]);

    console.log('Inserted user:', insertResult.rows[0]);

    return res.json({ created: true, account: insertResult.rows[0] });
  } catch (err) {
    console.error('Error during account creation:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});


// SIGN IN
app.post('/api/signin', async (req, res) => {
  const { email, password } = req.body;

  const errors = {};
  if (!email) errors.email = 'Email is required';
  if (!password) errors.password = 'Password is required';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const query = 'SELECT username, password FROM accountData WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rowCount === 0) {
      return res.status(401).json({
        errors: {
          email: 'Invalid email or password',
          password: 'Invalid email or password',
        }
      });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        errors: {
          email: 'Invalid email or password',
          password: 'Invalid email or password',
        }
      });
    }

    // Set cookie
    res.setHeader('Set-Cookie', cookie.serialize('loggedInUser', user.username, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'strict',
      path: '/',
    }));

    return res.json({ signedIn: true, username: user.username });
  } catch (err) {
    console.error('Error during sign-in:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

// USER STATS
app.get('/api/userstats', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const upcomingQuery = `
      SELECT COUNT(*) FROM meetings 
      WHERE attendee_username = $1 AND date > NOW()
    `;
    const attendedQuery = `
      SELECT COUNT(*) FROM meetings 
      WHERE attendee_username = $1 AND attended = TRUE
    `;
    const subscriptionsQuery = `
      SELECT COUNT(*) FROM subscriptions 
      WHERE subscriber_username = $1 AND active = TRUE
    `;
    const createdMeetingsQuery = `
      SELECT COUNT(*) FROM meetings 
      WHERE creator_username = $1
    `;

    const [upcoming, attended, subscriptions, created] = await Promise.all([
      pool.query(upcomingQuery, [username]),
      pool.query(attendedQuery, [username]),
      pool.query(subscriptionsQuery, [username]),
      pool.query(createdMeetingsQuery, [username])
    ]);

    return res.json({
      upcoming: upcoming.rows[0].count,
      attended: attended.rows[0].count,
      subscriptions: subscriptions.rows[0].count,
      created: created.rows[0].count
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
