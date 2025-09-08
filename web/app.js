import express from 'express';
import mustacheExpress from 'mustache-express';

const app = express();
app.use(express.json());

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', import.meta.dirname + '/public/');

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

const templateVar = {
    apiurl: process.env.API_URL || 'http://localhost:3000',
}

app.get('/', (req, res) => {
    res.render('index', { templatevar: `<script id="templatevar" type="application/json">${JSON.stringify(templateVar)}</script>` });
});

app.use(express.static(import.meta.dirname + '/public/'));

// 404
app.use((req, res) => {
    res.status(404).send('404 Not Found');
});

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
