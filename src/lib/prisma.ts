// Prisma client stub for demo/build without generated client
// Returns no-op methods for any model with sensible defaults
type AnyFn = (...args: any[]) => any;
const methodStub = new Proxy<AnyFn>(
    (() => { }) as AnyFn,
    {
        apply(_target, _thisArg, _args) {
            return Promise.resolve(undefined);
        },
    }
);

const modelStub = new Proxy<Record<string, AnyFn>>(
    {},
    {
        get(_target, prop) {
            const name = String(prop);
            if (name === 'count') return async () => 0;
            if (name === 'findMany') return async () => [];
            if (name === 'findFirst') return async () => null;
            if (name === 'create' || name === 'update' || name === 'upsert' || name === 'delete') return async () => ({});
            return methodStub;
        },
    }
);

export const prisma: any = new Proxy(
    {},
    {
        get(_target, prop) {
            const name = String(prop);
            if (name === '$on' || name === '$connect' || name === '$disconnect') {
                return () => { };
            }
            return modelStub;
        },
    }
);
