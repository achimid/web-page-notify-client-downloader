require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch');
const cron = require('node-cron');

module.exports = () => {
    const app = express()

    app.use(express.json())
    app.use(cors())
    app.disable('x-powered-by')

    app.get('/', async (req, res) => { res.json({status: 'ok'}) })

    cron.schedule(process.env.CRON_TIME_DEFAULT , () => fetch(process.env.API_URL).then(() => console.log('ping...')))

    app.listen(process.env.PORT)
}