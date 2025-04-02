import { writeFile } from "fs/promises";
import { NumberResult } from "../models/NumberResult";

export class ResultStorage {
    async saveResults(
        timeSpent: number,
        results: NumberResult[]
    ): Promise<void> {
        const output = {
            timeSpent,
            numbersGenerated: results.map((res) => res.number),
        };
        await writeFile("./result.json", JSON.stringify(output, null, 2), "utf-8");
        console.log("Results saved to result.json");
    }
}