const { Worker } = require('bullmq');
const redisConfig = {
    host: 'localhost', // Your Redis host
    port: 6379,        // Your Redis port
};



const campaignQueueName = 'JobName'; // This should match the queue name used in server.js

const processJob = async (job) => {
    // Extract job details
    const { keyword } = job.data;

        return 'processed: '+keyword;
};

const worker = new Worker(campaignQueueName, processJob, { connection: redisConfig,concurrency: 50});

worker.on('completed', (job, returnvalue) => {
    console.log(`Job completed with result ${returnvalue}`);
});

worker.on('failed', (job, err) => {
    console.error(`Job failed with error ${err.message}`);
});

worker.on('retrying', (job, err) => {
    console.log(`Job ${job.id} failed with error ${err.message} but is being retried!`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} has failed after ${job.attemptsMade} attempts: ${err.message}`);
});






console.log('Job processor is running...');
