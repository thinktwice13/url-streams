const {parseUrl} = require("./parse-url")

function readStream(inputStream) {
    // parsedUrls holds a set of checked urls to avoid duplicate requests
    const parsedUrls = new Set()

    // Input holds concatenated chunks with removed spaces and newlines
    // Resets every time outermost square brackets are closed
    let input = ""
    let brackets = []
    inputStream.on('data', (chunk) => {
        chunk = chunk.toString().replace(/\n/g, "")
        for (const c of chunk) {
            input += c
            if (c === "[") {
                brackets.push(c)
                continue
            }

            if (c === "]") {
                brackets.pop()
                if (brackets.length > 0) {
                    continue
                }
                // Outermost brackets closed. Reset input
                const url = lastUrlFromString(input)
                input = ""
                if (!url || parsedUrls.has(url)) {
                    continue
                }

                parseUrl(url, 1)
                parsedUrls.add(url)
            }
        }
    })
}

function bracketsFromString(input) {
    return input.match(/\[(.*?)\]/g)?.map(x => x.replace(/\[|\]/gi, ""))
}


function lastUrlFromString(input) {
    const urls = input.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/gi)
    if (urls) {
        return urls[urls.length - 1]
    }
}

module.exports = {
    readStream
}