//////////Basic stuff (keep unchanged)//////////
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcryptjs from 'bcryptjs';
import session from "express-session";
import FileStore from "session-file-store";
import cookieParser from "cookie-parser";

const app = express();

const FileStoreSession = FileStore(session);
app.use(cookieParser());

app.use(
  session({
    name: "usersignin",
    secret: process.env.SESSIONSECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    store: new FileStoreSession({ path: "./sessions" }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: false, 
      sameSite: 'lax',
    }
  })
);

app.use(cors({
origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
}));

app.use(express.json());

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.use((req, res, next) => {
  console.log('Session:', req.session);
  next();
});

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: process.env.PASSWORD,
  port: 5432,
});


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// API endpoint for creating account
app.post('/api/createaccount', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        code: 1000,
        message: "All fields are required"
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 12);
    
    // Check username and email in parallel
    const [usernameUsed, emailUsed] = await Promise.all([
      pool.query('SELECT username FROM accountcredentials WHERE username = $1', [username]),
      pool.query('SELECT email FROM accountcredentials WHERE email = $1', [email])
    ]);

    if (usernameUsed.rows.length > 0) {
      return res.status(409).json({
        code: 1002,
        message: "Username exists"
      });
    }

    if (emailUsed.rows.length > 0) {
      return res.status(409).json({
        code: 1001,
        message: "Email exists"
      });
    }

    // Create new account
    await pool.query(
      'INSERT INTO accountcredentials (username, email, password) VALUES ($1, $2, $3)',
      [username, email, hashedPassword]
    );

       await pool.query(
      'INSERT INTO otheraccountdata (username) VALUES ($1)',
      [username]
    );

    req.session.user = { username:username};

    return res.status(200).json({
      success: true,
      message: "Account created successfully",
     username: username
    });

  } catch (err) {
    console.error('Create account error:', err);
    return res.status(500).json({
      code: 1003,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Fixed signin endpoint
app.post('/api/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Get user from database
    const userResult = await pool.query(
      'SELECT password FROM accountcredentials WHERE username = $1',
      [username]
    );

    // Check if user exists
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare passwords
    const storedHash = userResult.rows[0].password;
    const doesDataMatch = await bcryptjs.compare(password, storedHash);
    
    if (!doesDataMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
   
    req.session.user = { username:username};

res.cookie('usersignin', 'testvalue', {
  httpOnly: true,
  secure: false, // must be false for local HTTP
  sameSite: 'lax', // lax is okay if frontend and backend are same-origin or localhost
  maxAge: 1000 * 60 * 60 * 24,
});



 req.session.save(err => {
  if (err) {
    console.error('Session save error:', err);
    return res.status(500).json({
      success: false,
      message: 'Session save failed'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    username: username
  });
});

  } catch (err) {
    console.error('Signin error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

app.post('/api/happeningwithaccount', async (req, res) => {
  try {
        if (!req.session?.user?.username) {
      return res.status(401).json({
        success: false,
        message: 'must be signed in to use feature'
      });
    }

    const username = req.session.user.username; 

    const upcoming_meetings = await pool.query(
      'SELECT upcoming_meetings FROM otheraccountdata WHERE username = $1',
      [username]
    );

      const attended_meetings = await pool.query(
      'SELECT attended_meetings FROM otheraccountdata WHERE username = $1',
      [username]
    );

      const active_subscriptions = await pool.query(
      'SELECT active_subscriptions FROM otheraccountdata WHERE username = $1',
      [username]
    );

      const meetings_created = await pool.query(
      'SELECT meetings_created FROM otheraccountdata WHERE username = $1',
      [username]
    );


  res.json({
  upcoming_meetings: upcoming_meetings.rows[0]?.upcoming_meetings || 0,
  attended_meetings: attended_meetings.rows[0]?.attended_meetings || 0,
  active_subscriptions: active_subscriptions.rows[0]?.active_subscriptions || 0,
  meetings_created: meetings_created.rows[0]?.meetings_created || 0,
  username: req.session.user.username
});

  } catch (err) {
    console.error(err.stack);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

