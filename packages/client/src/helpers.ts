export const pause = (duration) => new Promise(res => setTimeout(res, duration));

export const backoff = (fn, interval = 500, maxInterval = 60000) => {

    return fn().catch(async err => {
        const delay = interval*1.6 >= maxInterval ? maxInterval : interval*1.6

        await pause(delay)

        return backoff(fn, delay, maxInterval)
    });

}
