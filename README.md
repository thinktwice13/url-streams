# url-streams
> Node.js Code Challenge

# Node url-streams-challenge

## Task
- Write a node.js command line script that accepts an argument, which is a path (relative to the script location) to a text file.
- The script should parse the file for URLs within square brackets ([]). Some examples
- If there are multiple urls within the bracket pair, only the last one should be detected.
- If there are multiple levels of brackets, only the outermost ones count.
- There is also an escape character \ Bracket character following \ is ignored.
- As soon as the URL is detected, the script should make a HTTP GET request towards it.
- If the response is successful, the script should parse the response body, looking for two things:
    1. The contents of the <title> tag.
    2. Any email addresses
- If an e-mail is detected (in case of multiple e-mails, we just use the first one) anywhere on the page, we calculate it's SHA-256 hash (using the secret present in the IM_SECRET environment variable). Finally, the result should be outputted to stdout as JSON:
- If the original HTTP response was not successful, we should retry in exactly one minute, but only once. If the second response is unsuccessful, we should log the error to stderr (but not stop or exit the script) and not query that url anymore.
- Furthermore there should be a maximum of 1 http request made per second.
- If we encounter an url multiple times during parsing, it should be ignored after the first time.
- The output should contain one line per url.

### Bonus
- Write a unit test suite (using the framework/library) of your choice for the parser.
- Write an integration test suite for the whole script.
- In case no arguments are provided to the script (no path to the file), it should parse a stdin stream. It should not wait for the stream end, but make requests as soon as URLs are detected (according to the above rules). On stream end, the script should exit.

## Todo
- [] test
- [] docs
- [] sample input

## How to run
- clone repo
- `npm install`
- [optional] add a file with input content
- `node . <file>`
