/**
 * Real tests for error-handler.ts to increase actual coverage
 * Tests error classification and handling utilities
 */

import {
  ErrorCategory,
  classifyError,
  getErrorStatusCode,
  isRetryableError,
  getRetryDelay,
  formatErrorForLogging,
  createErrorFromResponse,
  withErrorHandling,
} from '@/lib/error-handler'

describe('error-handler - REAL TESTS', () => {
  describe('ErrorCategory enum', () => {
    it('should have all expected categories', () => {
      expect(ErrorCategory.NETWORK).toBe('NETWORK')
      expect(ErrorCategory.AUTHENTICATION).toBe('AUTHENTICATION')
      expect(ErrorCategory.AUTHORIZATION).toBe('AUTHORIZATION')
      expect(ErrorCategory.VALIDATION).toBe('VALIDATION')
      expect(ErrorCategory.NOT_FOUND).toBe('NOT_FOUND')
      expect(ErrorCategory.SERVER).toBe('SERVER')
      expect(ErrorCategory.RATE_LIMIT).toBe('RATE_LIMIT')
      expect(ErrorCategory.CONFLICT).toBe('CONFLICT')
      expect(ErrorCategory.UNKNOWN).toBe('UNKNOWN')
    })
  })

  describe('classifyError', () => {
    describe('Network errors', () => {
      it('should classify fetch errors as NETWORK', () => {
        const error = new Error('Failed to fetch data')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.NETWORK)
        expect(result.canRetry).toBe(true)
        expect(result.userMessage).toContain('connexion')
      })

      it('should classify network errors as NETWORK', () => {
        const error = new Error('Network error occurred')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.NETWORK)
      })

      it('should classify timeout errors as NETWORK', () => {
        const error = new Error('Request timeout')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.NETWORK)
      })

      it('should classify ECONNREFUSED as NETWORK', () => {
        const error = new Error('ECONNREFUSED')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.NETWORK)
      })

      it('should classify ENOTFOUND as NETWORK', () => {
        const error = new Error('ENOTFOUND')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.NETWORK)
      })
    })

    describe('Authentication errors', () => {
      it('should classify unauthorized errors as AUTHENTICATION', () => {
        const error = new Error('Unauthorized access')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.AUTHENTICATION)
        expect(result.canRetry).toBe(false)
        expect(result.statusCode).toBe(401)
      })

      it('should classify 401 errors as AUTHENTICATION', () => {
        const error = new Error('HTTP 401 error')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.AUTHENTICATION)
      })
    })

    describe('Authorization errors', () => {
      it('should classify forbidden errors as AUTHORIZATION', () => {
        const error = new Error('Forbidden access')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.AUTHORIZATION)
        expect(result.canRetry).toBe(false)
        expect(result.statusCode).toBe(403)
      })

      it('should classify 403 errors as AUTHORIZATION', () => {
        const error = new Error('HTTP 403 error')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.AUTHORIZATION)
      })
    })

    describe('Not found errors', () => {
      it('should classify not found errors as NOT_FOUND', () => {
        const error = new Error('Resource not found')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.NOT_FOUND)
        expect(result.canRetry).toBe(false)
        expect(result.statusCode).toBe(404)
      })

      it('should classify 404 errors as NOT_FOUND', () => {
        const error = new Error('HTTP 404 error')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.NOT_FOUND)
      })
    })

    describe('Validation errors', () => {
      it('should classify validation errors as VALIDATION', () => {
        const error = new Error('Validation failed')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.VALIDATION)
        expect(result.canRetry).toBe(false)
      })

      it('should classify invalid errors as VALIDATION', () => {
        const error = new Error('Invalid input provided')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.VALIDATION)
      })

      it('should classify 400 errors as VALIDATION', () => {
        const error = new Error('HTTP 400 bad request')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.VALIDATION)
        expect(result.statusCode).toBe(400)
      })
    })

    describe('Rate limit errors', () => {
      it('should classify rate limit errors as RATE_LIMIT', () => {
        const error = new Error('Rate limit exceeded')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.RATE_LIMIT)
        expect(result.canRetry).toBe(true)
        expect(result.retryDelay).toBe(60000)
      })

      it('should classify 429 errors as RATE_LIMIT', () => {
        const error = new Error('HTTP 429 too many requests')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.RATE_LIMIT)
        expect(result.statusCode).toBe(429)
      })
    })

    describe('Conflict errors', () => {
      it('should classify conflict errors as CONFLICT', () => {
        const error = new Error('Conflict detected')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.CONFLICT)
        expect(result.canRetry).toBe(true)
      })

      it('should classify 409 errors as CONFLICT', () => {
        const error = new Error('HTTP 409 conflict')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.CONFLICT)
        expect(result.statusCode).toBe(409)
      })
    })

    describe('Server errors', () => {
      it('should classify server errors as SERVER', () => {
        const error = new Error('Internal server error')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.SERVER)
        expect(result.canRetry).toBe(true)
      })

      const serverCodes = ['500', '502', '503', '504']
      serverCodes.forEach(code => {
        it(`should classify ${code} errors as SERVER`, () => {
          const error = new Error(`HTTP ${code} error`)
          const result = classifyError(error)
          
          expect(result.category).toBe(ErrorCategory.SERVER)
        })
      })
    })

    describe('Unknown errors', () => {
      it('should classify unknown errors as UNKNOWN', () => {
        const error = new Error('Some random error message')
        const result = classifyError(error)
        
        expect(result.category).toBe(ErrorCategory.UNKNOWN)
        expect(result.canRetry).toBe(true)
      })

      it('should handle non-Error objects', () => {
        const result = classifyError('string error')
        
        expect(result.category).toBe(ErrorCategory.UNKNOWN)
        expect(result.originalError).toBeInstanceOf(Error)
      })

      it('should handle null', () => {
        const result = classifyError(null)
        
        expect(result.category).toBe(ErrorCategory.UNKNOWN)
      })

      it('should handle undefined', () => {
        const result = classifyError(undefined)
        
        expect(result.category).toBe(ErrorCategory.UNKNOWN)
      })
    })

    it('should include suggestions', () => {
      const networkError = classifyError(new Error('Network timeout'))
      const authError = classifyError(new Error('Unauthorized'))
      
      expect(networkError.suggestions).toBeDefined()
      expect(networkError.suggestions!.length).toBeGreaterThan(0)
      expect(authError.suggestions).toBeDefined()
    })

    it('should preserve original error', () => {
      const originalError = new Error('Network fetch failed')
      const result = classifyError(originalError)
      
      expect(result.originalError).toBe(originalError)
      expect(result.message).toBe('Network fetch failed')
    })
  })

  describe('getErrorStatusCode', () => {
    it('should extract status from object with status property', () => {
      const error = { status: 404, message: 'Not found' }
      expect(getErrorStatusCode(error)).toBe(404)
    })

    it('should return undefined for error without status', () => {
      const error = new Error('Plain error')
      expect(getErrorStatusCode(error)).toBeUndefined()
    })

    it('should return undefined for null', () => {
      expect(getErrorStatusCode(null)).toBeUndefined()
    })

    it('should return undefined for string', () => {
      expect(getErrorStatusCode('error')).toBeUndefined()
    })
  })

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      const error = classifyError(new Error('Network error'))
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return false for non-retryable errors', () => {
      const error = classifyError(new Error('Unauthorized'))
      expect(isRetryableError(error)).toBe(false)
    })

    it('should return false for validation errors', () => {
      const error = classifyError(new Error('Validation failed'))
      expect(isRetryableError(error)).toBe(false)
    })

    it('should return true for server errors', () => {
      const error = classifyError(new Error('Server error 500'))
      expect(isRetryableError(error)).toBe(true)
    })
  })

  describe('getRetryDelay', () => {
    it('should return retryDelay from error', () => {
      const error = classifyError(new Error('Rate limit 429'))
      expect(getRetryDelay(error)).toBe(60000)
    })

    it('should return default 3000ms when no retryDelay', () => {
      const error = classifyError(new Error('Unknown error'))
      error.retryDelay = undefined
      expect(getRetryDelay(error)).toBe(3000)
    })

    it('should return network error delay', () => {
      const error = classifyError(new Error('Network timeout'))
      expect(getRetryDelay(error)).toBe(3000)
    })
  })

  describe('formatErrorForLogging', () => {
    it('should format error for logging', () => {
      const error = classifyError(new Error('Test error'))
      const formatted = formatErrorForLogging(error)
      
      expect(formatted.category).toBe(error.category)
      expect(formatted.message).toBe(error.message)
      expect(formatted.timestamp).toBeDefined()
      expect(new Date(formatted.timestamp)).toBeInstanceOf(Date)
    })

    it('should include statusCode when present', () => {
      const error = classifyError(new Error('HTTP 404'))
      const formatted = formatErrorForLogging(error)
      
      expect(formatted.statusCode).toBe(404)
    })

    it('should include stack trace', () => {
      const error = classifyError(new Error('Stack test'))
      const formatted = formatErrorForLogging(error)
      
      expect(formatted.stack).toBeDefined()
    })
  })

  describe('createErrorFromResponse', () => {
    it('should create error from Response with JSON body', async () => {
      const mockResponse = {
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({ error: 'Invalid data' }),
      } as unknown as Response
      
      const error = await createErrorFromResponse(mockResponse)
      
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Invalid data')
      expect((error as any).status).toBe(400)
    })

    it('should use message from response JSON', async () => {
      const mockResponse = {
        status: 500,
        statusText: 'Server Error',
        json: jest.fn().mockResolvedValue({ message: 'Database error' }),
      } as unknown as Response
      
      const error = await createErrorFromResponse(mockResponse)
      
      expect(error.message).toBe('Database error')
    })

    it('should use default message on JSON parse error', async () => {
      const mockResponse = {
        status: 503,
        statusText: 'Service Unavailable',
        json: jest.fn().mockRejectedValue(new Error('Parse error')),
      } as unknown as Response
      
      const error = await createErrorFromResponse(mockResponse)
      
      expect(error.message).toBe('HTTP 503: Service Unavailable')
    })
  })

  describe('withErrorHandling', () => {
    it('should pass through successful results', async () => {
      const fn = jest.fn().mockResolvedValue('success')
      const wrapped = withErrorHandling(fn)
      
      const result = await wrapped()
      
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalled()
    })

    it('should classify and rethrow errors', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Network timeout'))
      const wrapped = withErrorHandling(fn)
      
      await expect(wrapped()).rejects.toMatchObject({
        category: ErrorCategory.NETWORK,
      })
    })

    it('should call onError callback', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Unauthorized'))
      const onError = jest.fn()
      const wrapped = withErrorHandling(fn, onError)
      
      try {
        await wrapped()
      } catch {
        // Expected
      }
      
      expect(onError).toHaveBeenCalled()
      expect(onError.mock.calls[0][0].category).toBe(ErrorCategory.AUTHENTICATION)
    })

    it('should preserve function arguments', async () => {
      const fn = jest.fn().mockImplementation((a, b) => Promise.resolve(a + b))
      const wrapped = withErrorHandling(fn)
      
      const result = await wrapped(1, 2)
      
      expect(result).toBe(3)
      expect(fn).toHaveBeenCalledWith(1, 2)
    })
  })

  describe('Error classification integration', () => {
    it('should handle complete error flow', async () => {
      const mockFetch = async () => {
        const response = {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: () => Promise.resolve({ error: 'Unauthorized Token expired' }),
        } as unknown as Response
        
        throw await createErrorFromResponse(response)
      }
      
      try {
        await mockFetch()
      } catch (error) {
        const classified = classifyError(error)
        
        expect(classified.category).toBe(ErrorCategory.AUTHENTICATION)
        expect(classified.canRetry).toBe(false)
        expect(classified.suggestions).toContain('Reconnectez-vous')
      }
    })

    it('should provide user-friendly messages for all categories', () => {
      const testCases = [
        { error: new Error('fetch failed'), expectContains: 'connexion' },
        { error: new Error('unauthorized'), expectContains: 'Session' },
        { error: new Error('forbidden'), expectContains: 'droits' },
        { error: new Error('not found'), expectContains: 'introuvable' },
        { error: new Error('validation'), expectContains: 'invalides' },
        { error: new Error('rate limit'), expectContains: 'requetes' },
        { error: new Error('conflict'), expectContains: 'Conflit' },
        { error: new Error('server 500'), expectContains: 'serveur' },
      ]
      
      testCases.forEach(({ error, expectContains }) => {
        const classified = classifyError(error)
        expect(classified.userMessage.toLowerCase()).toContain(expectContains.toLowerCase())
      })
    })
  })
})
