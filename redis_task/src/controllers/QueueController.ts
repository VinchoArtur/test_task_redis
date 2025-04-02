import { Request, Response } from "express";
import { RedisService } from "../services/RedisService";

export class QueueController {
    private redisService: RedisService;

    constructor(redisService: RedisService) {
        this.redisService = redisService;
    }

    async addNumber(req: Request, res: Response) {
        const number = parseInt(req.body.number, 10);
        if (isNaN(number)) {
            return res.status(400).send("Invalid number");
        }

        const isNew = await this.redisService.tryAddUniqueNumber(number);
        if (isNew) {
            res.send(`Number ${number} successfully added as unique.`);
        } else {
            res.status(409).send(`Number ${number} is already added.`);
        }
    }

    async getNumbersCount(req: Request, res: Response) {
        const count = await this.redisService.getUniqueCount();
        res.json({ uniqueNumbersCount: count });
    }
}