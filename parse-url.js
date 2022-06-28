const https = require("https");
const {createHmac} = require("crypto");

/**
 * reqOpts formats url for use with https module
 * Assumes https for urls starting with www
 * @param {string} url
 * @return {{path: string, hostname: string, port: number}}
 */
function reqOpts(url) {
    if (!url) throw new Error("url is required")

    // Assume https for www urls found
    if (url.startsWith("www")) {
        url = "https://" + url
    }
    const u = new URL(url)
    return  {
        hostname: u.hostname,
        port: url.startsWith("https") ? 443 : 80,
        path: u.pathname,
    }
}

/**
 * parseUrl makes a GET request to url and retries provided number of times. Waits 1 minute between retries.
 * @param url
 * @param retries
 */
function parseUrl(url, retries) {
    if (retries < 0) {
        return
    }

    function errCb(err) {
        console.error(url, err)
        if (retries < 1) {
            return
        }
        console.log("Retrying", url, "in 1 minute")
        setTimeout(() => {
            parseUrl(url, --retries);
        }, 60 * 1000)
    }

    const options = reqOpts(url)
    const req = https.get(options, (res) => {
        res.on('error', errCb)

        // Keep looking for content of first title tag and first email found in url response
        // When both found, destroy stream and print to stdout
        let title
        let email
        res.on('end', () => {
            process.stdout.write(JSON.stringify({
                url, title, email
            }) + "\n");
        });

        let response = ""
        res.on('data', (chunk) => {
            response += chunk;
            if (!title) title = titleFromResponse(response)
            if (!email) email = hash(emailFromResponse(response))
            if (title && email) res.destroy()
        });
    })

    req.on('error', errCb)
    req.end()
}

/**
 * titleFromResponse finds first title tag in response string provided
 * @param {string} text
 * @return {string|undefined}
 */
function titleFromResponse(text) {
    return text.match(/<title>(.*?)<\/title>/i)?.[1].trim()
}

/**
 * emailFromResponse finds first email found in response string provided
 *
 * @param {string} response
 * @return {string|undefined}
 */
function emailFromResponse(response) {
    let matches = response.match(/[a-zA-Z\d._-]+@[a-zA-Z\d._-]+\.[a-zA-Z]{2,4}/gi)
    if (!matches) {
        return
    }

    // Check matches against image regex, like image@80xauto.jpg
    // Return first valid email
    const imgRe = /(?!\S*\.(?:jpg|png|gif|bmp|webp)(?:[\s\n\r]|$))[A-Z\d._%+-]+@[A-Z\d.-]{3,65}\.[A-Z]{2,4}/gi
    for (const m of matches) {
        if (imgRe.test(m)) {
            return m
        }
    }
}

/**
 * hash creates a hash of the provided string
 * Requires IM_SECRET environment variable to be set
 * @param {string} s
 * @return {string|undefined}
 */
const hash = s => !s ? undefined : createHmac('sha256', process.env.IM_SECRET).update(s).digest('hex');

module.exports = {
    titleFromResponse, emailFromResponse, parseUrl, reqOpts
}