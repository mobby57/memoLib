declare module 'imapflow' {
  export interface ImapFlowOptions {
    host: string;
    port: number;
    secure?: boolean;
    auth: {
      user: string;
      pass?: string;
      accessToken?: string;
    };
    logger?: boolean | object;
    tls?: {
      rejectUnauthorized?: boolean;
    };
  }

  export interface MessageEnvelopeObject {
    from?: { name?: string; address?: string }[];
    to?: { name?: string; address?: string }[];
    cc?: { name?: string; address?: string }[];
    subject?: string;
    date?: Date;
    messageId?: string;
    inReplyTo?: string;
  }

  export interface FetchMessageObject {
    seq: number;
    uid: number;
    envelope: MessageEnvelopeObject;
    flags: Set<string>;
    bodyStructure?: object;
    source?: Buffer;
    internalDate?: Date;
  }

  export interface MailboxObject {
    exists: number;
    path: string;
    flags: Set<string>;
    permanentFlags: Set<string>;
    uidValidity?: number;
    uidNext?: number;
    highestModseq?: bigint;
  }

  export interface SearchObject {
    seen?: boolean;
    unseen?: boolean;
    flagged?: boolean;
    unflagged?: boolean;
    since?: Date;
    before?: Date;
    from?: string;
    to?: string;
    subject?: string;
    uid?: string;
  }

  export class ImapFlow {
    constructor(options: ImapFlowOptions);
    mailbox: MailboxObject | null;
    connect(): Promise<void>;
    logout(): Promise<void>;
    getMailboxLock(path: string): Promise<{ release: () => void }>;
    mailboxOpen(path: string, options?: { readOnly?: boolean }): Promise<MailboxObject>;
    fetchOne(seq: string, query: object): Promise<FetchMessageObject>;
    fetch(range: string, query: object): AsyncGenerator<FetchMessageObject>;
    search(query: SearchObject): Promise<number[]>;
    download(seq: string, part?: string): Promise<{ content: NodeJS.ReadableStream; meta?: object }>;
    messageFlagsAdd(seq: string | number[], flags: string[]): Promise<boolean>;
    messageFlagsRemove(seq: string | number[], flags: string[]): Promise<boolean>;
    messageDelete(seq: string | number[]): Promise<boolean>;
    messageMove(seq: string | number[], destination: string): Promise<object>;
    idle(): Promise<void>;
    on(event: string, listener: (...args: unknown[]) => void): this;
    close(): Promise<void>;
  }

  export default ImapFlow;
}
