const app = require('./api/index');

const PORT = process.env.PORT || 5000;

// Only start server if running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}