import { millisecond } from "../types";

export default async function pauseFor(timeout: millisecond): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(() => {
                resolve();
            }, timeout);
        } catch (e) {
            reject(new Error(e.toString()));
        }
    });
}
