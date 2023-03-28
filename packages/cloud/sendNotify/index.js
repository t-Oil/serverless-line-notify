const MongoClient = require('mongodb').MongoClient;
const moment = require('moment-timezone');
const axios = require('axios');
const qs = require('qs');

async function main() {
    try {
        await sendMsg('Running task')
        const notify = await notifyTask()

        return { status: notify };
    } catch (error) {
        return {
            "body": { "error": "There was a problem retrieving data." },
            "statusCode": 400
        };
    }
}

const notifyTask = async () => {
    const uri = process.env['DATABASE_URL'];
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const todayDate = +moment().tz("Asia/Bangkok").format('DD')
        const task = await client.db("notify").collection("task").find().toArray();

        const result = task.filter(el => el.is_active & +el.alerted_date === +todayDate)

        if (result.length === 0) {
            return
        }

        result.map((el) => {
            sendMsg(el.description)
        })

        return true;
    } catch (error) {
        sendMsg(error)
    } finally {
        await client.close();
    }
}

const sendMsg = (msg) => {
    const messageResponse = {
        message: `\n ${msg} ${moment().tz("Asia/Bangkok").format('DD-MM-YYYY')}`
    }

    axios.post(process.env['LINE_ENDPOINT'], qs.stringify(messageResponse), {
        headers: {
            Authorization: `Bearer ${process.env['LINE_API_KEY']}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
    })
}

module.exports.main = main; 
