/**
 * Suspends execution for the given amount of time.
 *
 * @param timeout sleep time in milliseconds
 */
export const sleep = (timeout: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, timeout));
}
