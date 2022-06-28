const https = require("https");

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
            console.log("retrying", url)
            parseUrl(url, --retries);
        }, 3 * 1000)
    }

    const options = reqOpts(url)
    const req = https.get(options, (res) => {
        res.on('error', errCb)

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
            if (!email) email = emailFromResponse(response)
            if (title && email) res.destroy()
        });
    })

    req.on('error', errCb)

    req.end()
}

function titleFromResponse(text) {
    return text.match(/<title>(.*?)<\/title>/i)?.[1].trim()
}

function emailFromResponse(response) {
    let matches = response.match(/[a-zA-Z\d._-]+@[a-zA-Z\d._-]+\.[a-zA-Z]{2,4}/gi)
    if (!matches) {
        return
    }

    // Check matches against image regex
    // Return first valid email
    const imgRe = /(?!\S*\.(?:jpg|png|gif|bmp|webp)(?:[\s\n\r]|$))[A-Z\d._%+-]+@[A-Z\d.-]{3,65}\.[A-Z]{2,4}/gi
    for (const m of matches) {
        if (imgRe.test(m)) {
            return m
        }
    }
}

module.exports = {
    titleFromResponse, emailFromResponse, parseUrl, reqOpts
}