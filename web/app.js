import express from 'express';

const app = express();
app.use(express.json());

app.use(express.static(import.meta.dirname + '/public/'));

app.get('/', (req, res) => {
    res.sendFile(import.meta.dirname + '/index.html');
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});