import * as winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const myFormat = printf((info: any) => {
  const { level, message, timestamp, ...meta } = info;
  return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        myFormat
      )
    })
  ],
});
