const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

const dbClient = new MongoClient("mongodb://127.0.0.1:27017/");

// Endpoint для получения временных данных с фильтрацией по дате
app.get('/api/:collection/measurements', async (req, res) => {
    const { collection } = req.params;
    const { fields, start_date, end_date } = req.query;

    console.log(`[GET /api/${collection}/measurements]: Fetching data for fields: ${fields}, from ${start_date} to ${end_date}`);

    await dbClient.connect();
    const dbCollection = dbClient.db("myLovelyDiagrams").collection(collection);

    try {
        const query = {
            timestamp: {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            }
        };

        const fieldsArray = Array.isArray(fields) ? fields : fields.split(',');
        console.log(fieldsArray);
        const projection = fieldsArray.reduce((proj, field) => {
            proj[field] = 1;
            return proj;
        }, { _id: 0, timestamp: 1 });

        const data = await dbCollection.find(query).project(projection).toArray();
        console.log(`[GET /api/${collection}/measurements]: Data fetched successfully`);
        res.send(data);
    } catch (err) {
        console.error(`[GET /api/${collection}/measurements Error]:`, err);
        res.status(500).send("Internal Server Error");
    } finally {
        await dbClient.close();
        console.log(`[GET /api/${collection}/measurements]: MongoDB connection closed.`);
    }
});


// Endpoint для получения метрик (среднее, минимум, максимум, стандартное отклонение)
app.get('/api/:collection/measurements/metrics', async (req, res) => {
    const { collection } = req.params;
    const { field } = req.query;

    console.log(`[GET /api/${collection}/measurements/metrics]: Fetching metrics for field: ${field}`);

    await dbClient.connect();
    const dbCollection = dbClient.db("myLovelyDiagrams").collection(collection);

    try {
        const data = await dbCollection.find({}).project({ _id: 0, [field]: 1 }).toArray();
        const values = data.map(item => item[field]);

        if (values.length === 0) {
            res.status(404).send("No data found for the specified field");
            return;
        }

        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const stdDev = Math.sqrt(values.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b) / values.length);

        const metrics = {
            avg: avg.toFixed(2),
            min: min.toFixed(2),
            max: max.toFixed(2),
            stdDev: stdDev.toFixed(2)
        };

        console.log(`[GET /api/${collection}/measurements/metrics]: Metrics calculated successfully`);
        res.send(metrics);
    } catch (err) {
        console.error(`[GET /api/${collection}/measurements/metrics Error]:`, err);
        res.status(500).send("Internal Server Error");
    } finally {
        await dbClient.close();
        console.log(`[GET /api/${collection}/measurements/metrics]: MongoDB connection closed.`);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});