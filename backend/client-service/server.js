const express = require('express');
const cors = require('cors');
const clientRoutes = require('./routes/clientRoutes');
const { getEvent } = require('../admin-service/controllers/adminController');

const app = express();
const PORT = process.env.PORT || 6001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/events', clientRoutes);

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'client-service',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Client Service is running',
        endpoints: {
            getEvents: 'GET /api/events',
            purchaseTicket: 'POST /api/events/:id/purchase',
            health: 'GET /health'
        }
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Client service running on port ${PORT}`);
        console.log(`Visit http://localhost:${PORT}/api/events to see all events`);
    });
}

module.exports = app;