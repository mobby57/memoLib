/**
 * Sensitive data redaction for logging
 * Removes or masks PII and credentials in logs
 */

const SENSITIVE_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  password: /"password"\s*:\s*"[^"]*"/gi,
  token: /(token|bearer|authorization|api[_-]?key)\s*[:=]\s*["']?[a-zA-Z0-9\-._~+\/]+=*["']?/gi,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  phone: /\b(\d{1,3}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  databaseUrl: /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^/\s"'\\]+/gi,
};
const SENSITIVE_KEY_PATTERN =
  /password|token|secret|key|credential|api.?key|bearer|authorization|email|phone|telephone|address|adresse|passport|birth|naissance|nationalit|ssn|credit.?card|nom|prenom|first.?name|last.?name|name|domicile|mobile|body|content|payload|response|raw/i;

export interface RedactionOptions {
  maskEmail?: boolean;
  maskPassword?: boolean;
  maskToken?: boolean;
  maskSSN?: boolean;
  maskPhone?: boolean;
  maskCreditCard?: boolean;
  maxDepth?: number;
  custom?: Record<string, RegExp>;
}

const DEFAULT_OPTIONS: RedactionOptions = {
  maskEmail: true,
  maskPassword: true,
  maskToken: true,
  maskSSN: true,
  maskPhone: true,
  maskCreditCard: true,
  maxDepth: 10,
};

/**
 * Mask a sensitive string value
 */
function maskValue(value: string, pattern: string = '***'): string {
  if (value.length <= 4) return pattern;
  const visibleChars = Math.ceil(value.length * 0.2);
  return value.substring(0, visibleChars) + pattern;
}

/**
 * Recursively redact sensitive data from an object
 */export function redactSensitiveData(
  data: unknown,
  options: RedactionOptions = {}
): unknown {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (opts.maxDepth === 0) return '***REDACTED***';
  
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    let redacted = data;
    
    if (opts.maskEmail) {
      redacted = redacted.replace(SENSITIVE_PATTERNS.email, '***@***.***');
    }
    if (opts.maskPassword) {
      redacted = redacted.replace(SENSITIVE_PATTERNS.password, '"password":"***"');
    }
    if (opts.maskToken) {
      redacted = redacted.replace(SENSITIVE_PATTERNS.token, '$1:***');
    }
    if (opts.maskSSN) {
      redacted = redacted.replace(SENSITIVE_PATTERNS.ssn, '***-**-****');
    }
    if (opts.maskPhone) {
      redacted = redacted.replace(SENSITIVE_PATTERNS.phone, '***-***-****');
    }
    if (opts.maskCreditCard) {
      redacted = redacted.replace(SENSITIVE_PATTERNS.creditCard, '****-****-****-****');
    }
    redacted = redacted.replace(SENSITIVE_PATTERNS.databaseUrl, '[CONNECTION_URL_REDACTED]');
    
    // Apply custom patterns
    if (opts.custom) {
      for (const [, pattern] of Object.entries(opts.custom)) {
        redacted = redacted.replace(pattern, '***');
      }
    }
    
    return redacted;
  }
  
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map((item) =>
        redactSensitiveData(item, {
          ...opts,
          maxDepth: opts.maxDepth ? opts.maxDepth - 1 : undefined,
        })
      );
    }
    
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Redact known sensitive fields
      if (
        SENSITIVE_KEY_PATTERN.test(key)
      ) {
        redacted[key] = '***REDACTED***';
      } else {
        redacted[key] = redactSensitiveData(value, {
          ...opts,
          maxDepth: opts.maxDepth ? opts.maxDepth - 1 : undefined,
        });
      }
    }
    return redacted;
  }
  
  return data;
}

/**
 * Format error for logging with sensitive data redacted
 */
export function formatErrorForLogging(error: unknown): Record<string, unknown> {
  const errorData: Record<string, unknown> = {};
  
  if (error instanceof Error) {
    errorData.message = error.message;
    errorData.stack = error.stack;
    errorData.name = error.name;
    
    // Include additional error properties
    for (const [key, value] of Object.entries(error)) {
      if (key !== 'message' && key !== 'stack' && key !== 'name') {
        errorData[key] = value;
      }
    }
  } else if (typeof error === 'object' && error !== null) {
    Object.assign(errorData, error);
  } else {
    errorData.error = String(error);
  }
  
  return redactSensitiveData(errorData) as Record<string, unknown>;
}

/**
 * Wrapper for console methods with automatic redaction
 */
export const securelog = {
  log: (message: string, data?: unknown) => {
    console.log(message, data ? redactSensitiveData(data) : '');
  },
  error: (message: string, error?: unknown) => {
    console.error(message, error ? redactSensitiveData(error) : '');
  },
  warn: (message: string, data?: unknown) => {
    console.warn(message, data ? redactSensitiveData(data) : '');
  },
  info: (message: string, data?: unknown) => {
    console.info(message, data ? redactSensitiveData(data) : '');
  },
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, data ? redactSensitiveData(data) : '');
    }
  },
};
