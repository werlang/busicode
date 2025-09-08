import express from 'express';
import mustacheExpress from 'mustache-express';

const app = express();
app.use(express.json());

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', import.meta.dirname + '/public/');

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.use(express.static(import.meta.dirname + '/public/'));

app.get('/', (req, res) => {
    res.render('index', { apiurl: process.env.API_URL || 'http://localhost:3000' });
});

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
