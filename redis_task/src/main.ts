import express, { Request, Response } from "express";
import { config } from "./configs/config";
import { RedisService } from "./services/RedisService";
import { ResultStorage } from "./services/ResultStorage";
import { QueueController } from "./controllers/QueueController";
import { Producer } from "./producers/Producer";
import { Consumer } from "./consumers/Consumer";
import {NumberResult} from "./models/NumberResult";

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

    const consumerCount = 5;
    const numberPerConsumer = Math.ceil(config.numberRange / consumerCount);

    const consumers: Consumer[] = [];
    const allResults: NumberResult[] = [];

    console.log("Запуск параллельных потребителей...");

    const consumerTasks = [];

    for (let i = 0; i < consumerCount; i++) {
        const consumer = new Consumer(redisService, `consumer-${i}`);
        consumers.push(consumer);
        const task = consumer.start(numberPerConsumer);
        consumerTasks.push(task);
    }

    const startTime = Date.now();
    const results = await Promise.all(consumerTasks);

    results.forEach(res => allResults.push(...res));

    const uniqueNumbers = Array.from(new Set(allResults.map(res => res.number))).sort((a, b) => a - b);

    producers.forEach((producer) => producer.stop());
    await Promise.all(producerTasks);

    const timeSpent = Date.now() - startTime;

    await resultStorage.saveResults(
        timeSpent,
        uniqueNumbers.map((number) => ({ number, generatedAt: new Date().toISOString() }))
    );

    redisService.disconnect();
    const seconds = Math.floor(timeSpent / 1000);
    const milliseconds = timeSpent % 1000;
    console.log(`Фоновый процесс завершён за ${seconds} секунд и ${milliseconds} миллисекунд`);

    console.log("Фоновый процесс успешно завершён!");
})();


