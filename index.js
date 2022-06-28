const fs = require("fs");
const https = require("https");

(() => {
    // Require process.env.IM_SECRET to exist
    // if (!process.env.IM_SECRET) {
    //     throw new Error('IM_SECRET is not set');
    //     process.exit(1)
    // }

    // Create input stream from file on provided path if exists
    // Otherwise, listen to input on stdin
    const inputStream = fs.existsSync(process.argv[2]) ? fs.createReadStream(process.argv[2], {
        encoding: "utf-8",
        highWaterMark: 16
    }) : process.stdin;

    process.on("unhandledRejection", (reason, p) => {
        console.error(reason, p);
        process.exit(1);
    })

    inputStream.on("error", (err) => {
        console.error(err);
        process.exit(1);
    })

    // TODO Handle stdin exit event

    inputStream.on('end', () => {
        console.log("Finished")
    })

    readStream(inputStream)
})()

function readChunk(chunk, pfx) {
    chunk.toString().replace(/\n/g, "")
    pfx += chunk
    return pfx
}

function bracketsFromString(input) {
    return input.match(/\[(.*?)]/g)?.map(x => x.replace(/\[]/g, ""))
}

function urlsFromInput(input) {
    return bracketsFromString(input)?.reduce((acc, b) => {
        const urlsInBracket = b.match(/(https?:\/\/)|(www)\S+/g)
        if (urlsInBracket) {
            acc.push(urlsInBracket[urlsInBracket.length - 1])
        }
        return acc
    }, [])
}

function titleTagContent(text) {
    return text.match(/<title>(.*?)<\/title>/i)?.[1]
}

function emailFromResponse(response) {
    let email = response.match(/[a-zA-Z\d._-]+@[a-zA-Z\d._-]+\.[a-zA-Z]{2,4}/gi)?.[0]
    const imgRe = /(?!\S*\.(?:jpg|png|gif|bmp|webp)(?:[\s\n\r]|$))[A-Z\d._%+-]+@[A-Z\d.-]{3,65}\.[A-Z]{2,4}/gi
    return email?.match(imgRe)?.[0];
}

function parseUrl(url, retries = 1) {
    if (retries < 1) {
        return
    }

    // Make GET request to url
    const orig = url.startsWith("https") ? url.substring(8) : url.startsWith("http") ? url.substring(7) : url
    const [host, path] = orig.split("/")
    const options = {
        hostname: host,
        // port: url.includes("https://") ? 443 : 80,
        port: 443,
        path: path ? "/" + path : "",
        method: 'GET'
    }

    const req = https.get(options, (res) => {
        let response = '';
        res.on('error', (err) => {
            console.error(err)
        })

        res.on('data', (chunk) => {
            response += chunk;
        });

        res.on('end', () => {
            process.stdout.write(JSON.stringify({
                url,
                title: titleTagContent(response),
                email: emailFromResponse(response)
            }) + "\n");
        });
    })


    req.on('error', (err) => {
        // If no more retries, log error and return
        if (retries < 1) {
            console.error(err)
            return
        }
        // If there are retries allowed, try in 1 minute
        setTimeout(() => {
            parseUrl(url, --retries);
        }, 60 * 1000)
    })

    req.end()
}

function readStream(inputStream) {
    let input = ""
    const parsedUrls = new Set()

    inputStream.on('data', (chunk) => {
        input = readChunk(chunk, input)
        const incomingUrls = urlsFromInput(input)

        if (!incomingUrls || incomingUrls.length < 1) {
            return
        }

        // Record and read each url
        for (const url of incomingUrls) {
            if (parsedUrls.has(url)) {
                continue
            }
            parseUrl(url)
            parsedUrls.add(url)
        }

        // Slice input to remove part where urls were found
        const lastUrl = incomingUrls[incomingUrls.length - 1]
        const lastUrlIdx = input.lastIndexOf(lastUrl) // TODO Can be returned from urlsFromInput
        input = this.data.slice(lastUrlIdx + lastUrl.length, input.length)
    })
}

