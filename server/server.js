const express = require('express');
const app = express();
const connectDB = require('./config/db');

const authRouter = require('./routes/api/auth');
const userRouter = require('./routes/api/users');
const profileRouter = require('./routes/api/profile');
const postRouter = require('./routes/api/posts');

const PORT = process.env.PORT || 8080;

// Connect Datebase
connectDB();

// Init Middleware
app.use(express.json({ extended: false }))

app.get('/', (req, res) => res.send('API running'));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/profile", profileRouter);
app.use("/api/posts", postRouter);


app.listen(PORT, () => {
  console.log(`server is listening to port ${PORT}`);
});