/**
 * Converts time in minutes to milliseconds.
 * @param {number} minutes
 * @returns {number}
 */
import { millisecond } from "../types";

export default function minToMsec(minutes: number): millisecond {
    return minutes * 60 * 1000;
}
