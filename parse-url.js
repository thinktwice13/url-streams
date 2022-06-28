const https = require("https");

function reqOpts(url) {
    // Make GET request to url
    const orig = url.startsWith("https") ? url.substring(8) : url.startsWith("http") ? url.substring(7) : url
    const [host, path] = orig.split("/")
    return {
        hostname: host, // port: url.includes("https://") ? 443 : 80,
        port: 443, path: path ? "/" + path : "", method: 'GET'
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
    console.log("reading", url)
    const req = https.get(options, (res) => {
        res.on('error', errCb)

        let title
        let email
        res.on('end', () => {
            process.stdout.write(JSON.stringify({
                url, title, email
            }) + "\n");
            // console.log("Finished", url)
        });

        let response = ""
        res.on('data', (chunk) => {
            response += chunk;
            if (!title) title = titleFromResponse(response)
            if (!email) email = emailFromResponse(response)
            // Todo slice response when title || email found
            // End early if both title and email found
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
    titleFromResponse, emailFromResponse, parseUrl,
}

