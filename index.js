import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import codeRouter from './pair.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

import 'events';
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 500;

app.use('/code', codeRouter);

app.use('/', async (req, res, next) => {
    res.sendFile(join(__dirname, 'pair.html'));
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log(`⏩ Server running on http://localhost:${PORT}`);
});

export default app;
