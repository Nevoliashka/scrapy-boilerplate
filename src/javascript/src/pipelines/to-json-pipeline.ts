import * as fs from "fs";

async function toJsonPipeline(item: object) {
    const data: string = JSON.stringify(item);
    await fs.appendFileSync('./to-json.json', data, { encoding: 'utf8', flag: 'a' });
}
