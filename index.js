const fs = require("fs");
const { readStream } = require("./read-stream");

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
        console.log("Input done")
    })

    readStream(inputStream)
})()