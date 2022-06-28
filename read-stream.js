const {parseUrl} = require("./parse-url")

/**
 * readStream handles stream data events and keeps track of total unparsed input, parsed urls amd matching brackets
 * @param inputStream
 */
function readStream(inputStream) {
    // parsedUrls holds a set of checked urls to avoid duplicate requests
    const parsedUrls = new Set()

    // Input holds concatenated chunks with removed spaces and newlines
    // Resets every time outermost square brackets are closed
    let input = ""
    let brackets = []

    inputStream.on("data", (chunk) => {
        input = handleInput(chunk, input,  brackets, parsedUrls)
    })
}

/**
 * handleInput handles input chunks and updates brackets matching stack and records parsed urls
 * Adds chunk chars to prefix input and checks for matching brackets iignores ones following an escapse character)
 * If outermost closing bracket is found, looks for last url in existing input
 * Records parsed urls (if not a duplicate). Resets and returns input prefix string
 * @param {string|Buffer} chunk
 * @param {string} prefix
 * @param {("["|"]")[]} brackets
 * @param {Set} parsedUrls
 * @return {string}
 */
function handleInput(chunk,prefix, brackets, parsedUrls) {
    chunk = chunk.toString().replace(/\n/g, "")
    const chunkLen = chunk.length
    for (let i = 0; i < chunkLen; i++) {
        const c = chunk[i]
        // Add chink chars to prefix input
        input += c

        if (c === "[") {
            if (chunk[i - 1] === "\\") {
                i++
                continue
            }

            brackets.push(c)
            continue
        }

        if (c === "]") {
            if (chunk[i - 1] === "\\") {
                i++
                continue
            }
            brackets.pop()
            if (brackets.length > 0) {
                continue
            }

            // Outermost brackets closed. Reset input and look for urls
            // IParse if not already in parsed set
            // Reset inpuy
            const url = lastUrlFromString(input)
            input = ""
            if (!url || parsedUrls.has(url)) {
                continue
            }

            parseUrl(url, 1)
            parsedUrls.add(url)
        }
    }

    return input
}

/**
 * lastUrlFromString looks for a last url in provided string
 * @param {string} input
 * @return {string|undefined}
 */
function lastUrlFromString(input) {
    const urls = input.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/gi)
    if (urls) {
        return urls[urls.length - 1]
    }
}

module.exports = {
    readStream, lastUrlFromString, handleInput
}