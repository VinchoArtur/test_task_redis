import express, { Request, Response } from "express";
import { config } from "./configs/config";
import { RedisService } from "./services/RedisService";
import { ResultStorage } from "./services/ResultStorage";
import { QueueController } from "./controllers/QueueController";
import { Producer } from "./producers/Producer";
import { Consumer } from "./consumers/Consumer";

const app = express();
const port = 3000;

// Услуги
const redisService = new RedisService(config.redis.queueName);
const resultStorage = new ResultStorage();

const queueController = new QueueController(redisService);

app.use(express.json());


redisService.redis.ping()
    .then((response) => console.log("Redis connection status:", response))
    .catch((error) => console.error("Redis connection error:", error));


app.post("/queue", (req: Request, res: Response) => {
    queueController.addNumber(req, res).catch((err) => {
        console.error(err);
        res.status(500).send("Internal Server Error");
    });
});
app.get("/queue", (req: Request, res: Response) => {
    queueController.getQueue(req, res).catch((err) => {
        console.error(err);
        res.status(500).send("Internal Server Error");
    });
});

app.get("/", (req: Request, res: Response) => {
    res.send("Hello, World! Queue system is running.");
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

(async () => {
    const producers: Producer[] = [];
    const producerTasks: Promise<void>[] = [];

    for (let i = 0; i < config.producersCount; i++) {
        const producer = new Producer(i, config.numberRange, redisService);
        producers.push(producer);
        producerTasks.push(producer.start());
    }

    const consumer = new Consumer(redisService);

    console.log("Starting background processing...");
    const startTime = Date.now();

    const results = await consumer.start(config.numberRange);

    producers.forEach((producer) => producer.stop());
    await Promise.all(producerTasks);

    const timeSpent = Date.now() - startTime;
    await resultStorage.saveResults(timeSpent, results);

    redisService.disconnect();
    console.log("Background processing finished successfully!");
})();
