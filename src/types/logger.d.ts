/**
 * Logger type declarations
 */

export interface Logger {
  info(message: string, context?: any): void;
  error(message: string, error?: any, context?: any): void;
  warn(message: string, context?: any): void;
  debug(message: string, context?: any): void;
}

export declare const logger: Logger;
