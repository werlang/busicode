import express from 'express';

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.use(express.static(import.meta.dirname + '/public/'));

app.get('/', (req, res) => {
    res.sendFile(import.meta.dirname + '/index.html');
});

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
