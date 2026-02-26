declare module '@prisma/client' {
    export type Prisma = Record<string, unknown>;

    export class PrismaClient {
        constructor(...args: any[]);
        $disconnect(): Promise<void>;
        $connect(): Promise<void>;
        $transaction<T>(promises: Promise<T>[]): Promise<T[]>;
        $on(eventType: string, callback: (...args: any[]) => void): void;
        [key: string]: any;
    }
}
