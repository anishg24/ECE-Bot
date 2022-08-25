import {pino} from "pino";

const transport = pino.transport({
    target: 'pino/file',
    options: {destination: './log.json'}
});

export const logger = pino();