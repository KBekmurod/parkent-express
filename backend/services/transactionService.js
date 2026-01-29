const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { DatabaseError } = require('../utils/errorTypes');

class TransactionService {
  async executeWithTransaction(operations, options = {}) {
    const session = await mongoose.startSession();
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 100;
    let currentAttempt = 0;

    while (currentAttempt < maxRetries) {
      try {
        session.startTransaction({
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
          readPreference: 'primary',
          ...options.transactionOptions
        });

        logger.debug('Transaction started', { attempt: currentAttempt + 1 });

        const result = await operations(session);

        await session.commitTransaction();
        logger.info('Transaction committed successfully', { attempt: currentAttempt + 1 });

        return result;
      } catch (error) {
        await session.abortTransaction();
        logger.warn('Transaction aborted', { 
          attempt: currentAttempt + 1, 
          error: error.message 
        });

        if (this.isRetriableError(error) && currentAttempt < maxRetries - 1) {
          currentAttempt++;
          const delay = retryDelay * Math.pow(2, currentAttempt - 1);
          logger.info(`Retrying transaction after ${delay}ms`, { 
            attempt: currentAttempt + 1 
          });
          await this.sleep(delay);
        } else {
          logger.error('Transaction failed after retries', {
            attempts: currentAttempt + 1,
            error: error.message,
            stack: error.stack
          });
          throw new DatabaseError(
            `Transaction failed: ${error.message}`,
            'transaction'
          );
        }
      } finally {
        session.endSession();
      }
    }
  }

  isRetriableError(error) {
    if (!error) return false;

    const retriableCodes = [
      112, // WriteConflict
      251, // NoSuchTransaction
      10107 // NotMaster
    ];

    const retriableMessages = [
      'WriteConflict',
      'TransientTransactionError',
      'NoSuchTransaction',
      'NotMaster'
    ];

    if (error.code && retriableCodes.includes(error.code)) {
      return true;
    }

    if (error.errorLabels && error.errorLabels.includes('TransientTransactionError')) {
      return true;
    }

    const errorMessage = error.message || '';
    return retriableMessages.some(msg => errorMessage.includes(msg));
  }

  async withRetry(operation, maxRetries = 3, retryDelay = 100) {
    let currentAttempt = 0;

    while (currentAttempt < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        if (this.isRetriableError(error) && currentAttempt < maxRetries - 1) {
          currentAttempt++;
          const delay = retryDelay * Math.pow(2, currentAttempt - 1);
          logger.info(`Retrying operation after ${delay}ms`, { 
            attempt: currentAttempt + 1 
          });
          await this.sleep(delay);
        } else {
          throw error;
        }
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new TransactionService();
