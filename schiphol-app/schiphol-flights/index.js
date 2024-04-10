import { App } from '@tinyhttp/app';
import { logger } from '@tinyhttp/logger';
import { Liquid } from 'liquidjs';
import serveStatic from 'serve-static';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const app = new App();
const engine = new Liquid();

engine
  .parseAndRender("{{name | capitalize}}", { name: "alice" })
  .then(console.log); // outputs 'Alice'

app.use(serveStatic('public'));

// schiphol api
app.get('/:page?', (req, res) => {
    const page = req.params.page || 0;
    
    const options = {
        hostname: 'api.schiphol.nl',
        path: '/public-flights/flights',
        method: 'GET',
        headers: {
            'ResourceVersion': 'v4',
            'Accept': 'application/json',
            'app_id': process.env.APP_ID,
            'app_key': process.env.APP_KEY
        }
    };
    
    const request = https.request(options, response => {
        let chunks = [];
    
        response.on('data', chunk => {
            chunks.push(chunk);
        });
    
        response.on('end', async () => {
            const body = Buffer.concat(chunks);
            const data = JSON.parse(body.toString());
            console.log(data);
    
            const flights = data.flights;
    
            const today = new Date();
            const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
            const flightsOfToday = flights.filter(flight => flight.scheduleDate === todayString);
    
            console.log(flightsOfToday);
    
            // Render the index page using Liquid
            const html = await engine.renderFile('./views/index.liquid', { flights: flightsOfToday, page: page });
            res.send(html);
        });
    });
    
    request.on('error', error => {
        console.error('Error:', error);
    });
    
    request.end();
});

app.use(logger());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});