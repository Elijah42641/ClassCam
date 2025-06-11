//////////Basic stuff (keep unchanged)//////////
import 'dotenv/config';
import express from 'express';
import { Pool } from 'pg';
import bcryptjs from 'bcryptjs';
import session from "express-session";
import FileStore from "session-file-store";
import cookieParser from "cookie-parser";
import multer from "multer";

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const FileStoreSession = FileStore(session);
app.use(cookieParser());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'pfp-' + uniqueSuffix + ext); // pfp-1234567890.jpg
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'), false);
    }
  }
});

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

app.use(express.json());

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.use((req, res, next) => {
  console.log('Session:', req.session);
  next();
});

app.use(express.static(path.join(__dirname, 'frontend')));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: process.env.PASSWORD,
  port: 5432,
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

//for redirecting if not signed in
app.post('/api/usersignedin', async(req, res) => {
  try {
   if (!req.session.user || req.session.user===undefined) {
    return res.status(401).json({
      message:'user unauthorized'
    }
    );
   }
   console.log(req.session.user);
  }

  catch(err) {
    if (err===401) {
      return res.status(401).json({
        message:'user unauthorized'
      });
    }
    console.error(err) 
  }
})

//upload pfp to database      
//                           👇 processes file
app.post('/api/pfp-to-db', upload.single('profilePic'), async (req,res) => {
  try {
    //check if user uploads file
    if (!req.file) {
  return res.status(400).json({ error: 'No file uploaded' });
}
      req.body= { profilePic, username } //later in html give the profile pic to be inserted to have a name prop of profilePic
      //path to image   👇
      const filePathForImage = `/uploads/${req.file.filename}`;
      const insertPfp = await pool.query(`UPDATE otheraccountdata (Profile_pic) SET ($1) WHERE username=$2` [filePathForImage,username]);
    }                                                                

  catch (error) {
    console.error(error);
  }
});