import { format, transports } from 'winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

// Cấu hình ghi log ra file theo ngày để dễ theo dõi
const fileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m', // Tối đa 20MB cho mỗi file log
  maxFiles: '14d', // Giữ file log trong vòng 14 ngày
  level: 'error',
});

const combinedFileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

// Cấu hình chính của Winston
export const winstonConfig: winston.LoggerOptions = {
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json() // Lưu dưới định dạng JSON để dễ query và phân tích
  ),
  transports: [
    // Ghi ra console khi chạy ở môi trường dev
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, stack }) => {
          return `${timestamp} ${level}: ${message} ${stack ? '\n' + stack : ''}`;
        })
      ),
    }),
    fileTransport,
    combinedFileTransport,
  ],
};
