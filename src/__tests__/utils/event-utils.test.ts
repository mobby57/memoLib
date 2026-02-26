/**
 * Tests pour les utilitaires d'événements et event emitter
 * Couverture: EventEmitter, pub/sub, debounce, throttle
 */

describe('Event Utils', () => {
  describe('Simple Event Emitter', () => {
    const createEventEmitter = <T extends Record<string, unknown[]>>() => {
      const listeners = new Map<keyof T, Array<(...args: unknown[]) => void>>();
      
      return {
        on: <K extends keyof T>(event: K, handler: (...args: T[K]) => void) => {
          if (!listeners.has(event)) {
            listeners.set(event, []);
          }
          listeners.get(event)!.push(handler as (...args: unknown[]) => void);
        },
        off: <K extends keyof T>(event: K, handler: (...args: T[K]) => void) => {
          const eventListeners = listeners.get(event);
          if (eventListeners) {
            const index = eventListeners.indexOf(handler as (...args: unknown[]) => void);
            if (index !== -1) {
              eventListeners.splice(index, 1);
            }
          }
        },
        emit: <K extends keyof T>(event: K, ...args: T[K]) => {
          const eventListeners = listeners.get(event);
          if (eventListeners) {
            eventListeners.forEach((handler) => handler(...args));
          }
        },
        listenerCount: <K extends keyof T>(event: K): number => {
          return listeners.get(event)?.length ?? 0;
        },
      };
    };

    it('devrait émettre des événements', () => {
      const emitter = createEventEmitter<{ test: [string] }>();
      const handler = jest.fn();
      
      emitter.on('test', handler);
      emitter.emit('test', 'hello');
      
      expect(handler).toHaveBeenCalledWith('hello');
    });

    it('devrait supporter plusieurs listeners', () => {
      const emitter = createEventEmitter<{ test: [] }>();
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.emit('test');
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('devrait supprimer un listener', () => {
      const emitter = createEventEmitter<{ test: [] }>();
      const handler = jest.fn();
      
      emitter.on('test', handler);
      emitter.off('test', handler);
      emitter.emit('test');
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('devrait compter les listeners', () => {
      const emitter = createEventEmitter<{ test: [] }>();
      
      emitter.on('test', () => {});
      emitter.on('test', () => {});
      
      expect(emitter.listenerCount('test')).toBe(2);
    });
  });

  describe('Once Handler', () => {
    const createEventEmitterWithOnce = () => {
      const listeners = new Map<string, Array<{ handler: (...args: unknown[]) => void; once: boolean }>>();
      
      return {
        on: (event: string, handler: (...args: unknown[]) => void) => {
          if (!listeners.has(event)) listeners.set(event, []);
          listeners.get(event)!.push({ handler, once: false });
        },
        once: (event: string, handler: (...args: unknown[]) => void) => {
          if (!listeners.has(event)) listeners.set(event, []);
          listeners.get(event)!.push({ handler, once: true });
        },
        emit: (event: string, ...args: unknown[]) => {
          const eventListeners = listeners.get(event);
          if (eventListeners) {
            const toKeep = eventListeners.filter((l) => {
              l.handler(...args);
              return !l.once;
            });
            listeners.set(event, toKeep);
          }
        },
      };
    };

    it('devrait appeler once une seule fois', () => {
      const emitter = createEventEmitterWithOnce();
      const handler = jest.fn();
      
      emitter.once('test', handler);
      emitter.emit('test');
      emitter.emit('test');
      
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Debounce', () => {
    const debounce = <T extends (...args: unknown[]) => unknown>(
      fn: T,
      delay: number
    ): ((...args: Parameters<T>) => void) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      
      return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    };

    it('devrait retarder l\'exécution', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const debounced = debounce(fn, 100);
      
      debounced();
      expect(fn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('devrait annuler les appels précédents', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const debounced = debounce(fn, 100);
      
      debounced();
      debounced();
      debounced();
      
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });
  });

  describe('Throttle', () => {
    const throttle = <T extends (...args: unknown[]) => unknown>(
      fn: T,
      limit: number
    ): ((...args: Parameters<T>) => void) => {
      let inThrottle = false;
      
      return (...args: Parameters<T>) => {
        if (!inThrottle) {
          fn(...args);
          inThrottle = true;
          setTimeout(() => { inThrottle = false; }, limit);
        }
      };
    };

    it('devrait limiter les appels', () => {
      jest.useFakeTimers();
      const fn = jest.fn();
      const throttled = throttle(fn, 100);
      
      throttled();
      throttled();
      throttled();
      
      expect(fn).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(100);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });
  });

  describe('Pub/Sub Pattern', () => {
    const createPubSub = <T>() => {
      const subscribers = new Set<(data: T) => void>();
      
      return {
        subscribe: (callback: (data: T) => void) => {
          subscribers.add(callback);
          return () => subscribers.delete(callback);
        },
        publish: (data: T) => {
          subscribers.forEach((callback) => callback(data));
        },
        subscriberCount: () => subscribers.size,
      };
    };

    it('devrait publier aux abonnés', () => {
      const pubsub = createPubSub<string>();
      const handler = jest.fn();
      
      pubsub.subscribe(handler);
      pubsub.publish('message');
      
      expect(handler).toHaveBeenCalledWith('message');
    });

    it('devrait retourner une fonction de désabonnement', () => {
      const pubsub = createPubSub<string>();
      const handler = jest.fn();
      
      const unsubscribe = pubsub.subscribe(handler);
      unsubscribe();
      pubsub.publish('message');
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Event Queue', () => {
    const createEventQueue = <T>() => {
      const queue: T[] = [];
      let processing = false;
      let processor: ((event: T) => Promise<void>) | null = null;
      
      const process = async () => {
        if (processing || !processor) return;
        processing = true;
        
        while (queue.length > 0) {
          const event = queue.shift()!;
          await processor(event);
        }
        
        processing = false;
      };
      
      return {
        enqueue: (event: T) => {
          queue.push(event);
          process();
        },
        setProcessor: (fn: (event: T) => Promise<void>) => {
          processor = fn;
        },
        length: () => queue.length,
      };
    };

    it('devrait mettre en queue les événements', async () => {
      const queue = createEventQueue<number>();
      const processed: number[] = [];
      
      queue.setProcessor(async (n) => {
        processed.push(n);
      });
      
      queue.enqueue(1);
      queue.enqueue(2);
      
      // Wait for processing
      await new Promise((r) => setTimeout(r, 10));
      
      expect(processed).toEqual([1, 2]);
    });
  });

  describe('Event Filter', () => {
    const createFilteredEmitter = <T>() => {
      type Handler = (data: T) => void;
      type Filter = (data: T) => boolean;
      
      const handlers: Array<{ handler: Handler; filter?: Filter }> = [];
      
      return {
        on: (handler: Handler, filter?: Filter) => {
          handlers.push({ handler, filter });
        },
        emit: (data: T) => {
          handlers.forEach(({ handler, filter }) => {
            if (!filter || filter(data)) {
              handler(data);
            }
          });
        },
      };
    };

    it('devrait filtrer les événements', () => {
      const emitter = createFilteredEmitter<number>();
      const handler = jest.fn();
      
      emitter.on(handler, (n) => n > 5);
      emitter.emit(3);
      emitter.emit(7);
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(7);
    });
  });

  describe('Async Event Handling', () => {
    const createAsyncEmitter = <T>() => {
      const handlers: Array<(data: T) => Promise<void>> = [];
      
      return {
        on: (handler: (data: T) => Promise<void>) => {
          handlers.push(handler);
        },
        emit: async (data: T) => {
          await Promise.all(handlers.map((h) => h(data)));
        },
        emitSequential: async (data: T) => {
          for (const handler of handlers) {
            await handler(data);
          }
        },
      };
    };

    it('devrait attendre tous les handlers', async () => {
      const emitter = createAsyncEmitter<string>();
      const results: string[] = [];
      
      emitter.on(async (data) => {
        await new Promise((r) => setTimeout(r, 10));
        results.push(data + '1');
      });
      emitter.on(async (data) => {
        results.push(data + '2');
      });
      
      await emitter.emit('test');
      
      expect(results).toHaveLength(2);
    });
  });

  describe('Event Replay', () => {
    const createReplayEmitter = <T>(bufferSize: number) => {
      const buffer: T[] = [];
      const handlers: Array<(data: T) => void> = [];
      
      return {
        emit: (data: T) => {
          buffer.push(data);
          if (buffer.length > bufferSize) {
            buffer.shift();
          }
          handlers.forEach((h) => h(data));
        },
        subscribe: (handler: (data: T) => void) => {
          // Replay buffered events
          buffer.forEach((data) => handler(data));
          handlers.push(handler);
        },
      };
    };

    it('devrait rejouer les événements bufférisés', () => {
      const emitter = createReplayEmitter<number>(3);
      const handler = jest.fn();
      
      emitter.emit(1);
      emitter.emit(2);
      emitter.emit(3);
      
      emitter.subscribe(handler);
      
      expect(handler).toHaveBeenCalledWith(1);
      expect(handler).toHaveBeenCalledWith(2);
      expect(handler).toHaveBeenCalledWith(3);
    });
  });

  describe('Event Transformation', () => {
    const createMappedEmitter = <T, U>(transform: (data: T) => U) => {
      const handlers: Array<(data: U) => void> = [];
      
      return {
        emit: (data: T) => {
          const transformed = transform(data);
          handlers.forEach((h) => h(transformed));
        },
        on: (handler: (data: U) => void) => {
          handlers.push(handler);
        },
      };
    };

    it('devrait transformer les événements', () => {
      const emitter = createMappedEmitter<number, string>((n) => `value: ${n}`);
      const handler = jest.fn();
      
      emitter.on(handler);
      emitter.emit(42);
      
      expect(handler).toHaveBeenCalledWith('value: 42');
    });
  });

  describe('Event Aggregation', () => {
    const createAggregator = <T>(windowMs: number) => {
      let buffer: T[] = [];
      let timeout: ReturnType<typeof setTimeout> | null = null;
      let handler: ((events: T[]) => void) | null = null;
      
      return {
        add: (event: T) => {
          buffer.push(event);
          
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            if (handler && buffer.length > 0) {
              handler([...buffer]);
              buffer = [];
            }
          }, windowMs);
        },
        onFlush: (fn: (events: T[]) => void) => {
          handler = fn;
        },
      };
    };

    it('devrait agréger les événements', () => {
      jest.useFakeTimers();
      const aggregator = createAggregator<number>(100);
      const handler = jest.fn();
      
      aggregator.onFlush(handler);
      aggregator.add(1);
      aggregator.add(2);
      aggregator.add(3);
      
      jest.advanceTimersByTime(100);
      
      expect(handler).toHaveBeenCalledWith([1, 2, 3]);
      
      jest.useRealTimers();
    });
  });
});
