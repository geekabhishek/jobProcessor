process.env.TZ = 'Asia/Kolkata';
require('dotenv').config();
const express = require('express');
const Queue = require('bull');
const { createBullBoard } = require('bull-board');
const { BullAdapter } = require('bull-board/bullAdapter');

// Create a new queue
const contentQueue = new Queue('JobName', process.env.REDIS_URL);

// Setup Bull Board
const { router } = createBullBoard([
    new BullAdapter(contentQueue)
]);

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());


// Define the route to submit keywords (or any other task)
app.post('/submitKeyword', async (req, res) => {
    const { keyword } = req.body;

    if (!keyword) {
        return res.status(400).send('Keyword is required');
    }

    try {
        // Define the job data
        const jobData = {
            keyword: keyword
        };

        // Add the job to the queue and capture the job ID
        const job = await contentQueue.add(jobData);

        // Return the job ID in the response
        res.send({ message: 'Your request has been queued.', jobId: job.id });
    } catch (error) {
        console.error('Error adding job to queue:', error);
        res.status(500).send('Failed to queue your request');
    }
});

app.get('/job/:jobId', async (req, res) => {
    const jobId = req.params.jobId;

    try {
        // Fetch the job from the queue based on the job ID
        const job = await contentQueue.getJob(jobId);

        if (job) {
            let responseData = {
                jobId: job.id,
                status: job.state,
            };

            if (job.returnvalue) {
                // If the job has a return value (completed), include it in the response
                responseData.result = job.returnvalue;
            } else {
                // If the job is still in progress or failed, include its data in the response
                responseData.data = job.data;
            }

            res.json(responseData);
        } else {
            // If the job does not exist, return a 404 Not Found response
            res.status(404).json({ message: 'Job not found' });
        }
    } catch (error) {
        console.error('Error fetching job data:', error);
        res.status(500).send('Failed to fetch job data');
    }
});





// Serve Bull Board at '/queues' endpoint
app.use('/queues', router);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
