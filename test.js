const {lastUrlFromString, handleInput} = require("./read-stream");
const {parseUrl, titleFromResponse, emailFromResponse, reqOpts} = require("./parse-url");

jest.mock('./parse-url', () => ({
    ...(jest.requireActual('./parse-url')),
    parseUrl: jest.fn()
}))

describe("handleInput", () => {
    const tests = [
        {name: "ignored", in: "bla bla asdfasdf www.google.com", want: undefined},
        {name: "detected", in: "yet another example [ some text www.google.com ] sdfgsd", want: "www.google.com"},
        {
            name: "handles two urls in input",
            in: "multiple urls [bla www.first.com asdfasdf www.second.com truc]",
            want: "www.second.com"
        },
        {
            name: "handles nested brackets",
            in: "multiple levels[ [www.first.com] www.second.com]",
            want: "www.second.com"
        },
        {
            name: "handles nested brackets 2",
            in: "multiple levels[ www.first.com [www.third.com]]",
            want: "www.third.com"
        },
        {name: "bracket following escape char is ignored", in: "asdf \\[www.google.com]", want: undefined}
    ]

    for (const test of tests) {
        it(test.name, function () {
            handleInput("", test.in, [], new Set())
            if (!test.want) expect(parseUrl).not.toHaveBeenCalled()
            else expect(parseUrl).toHaveBeenCalledWith(test.want, 1);
            jest.clearAllMocks()
        });
    }
})

describe('urlFromInput', function () {
    const tests = [
        {
            name: "finds www url in bracket",
            in: "yet another example [ some text www.google.com ] sdfgsd",
            want: "www.google.com"
        },
        {name: "finds http://www url in bracket", in: "[ http://www.google.com ] kuliu", want: "http://www.google.com"},
        {
            name: "finds https://www url in bracket",
            in: "[ https://www.google.com ] kuliu",
            want: "https://www.google.com"
        },
        {name: "finds http?:// url in bracket", in: "[ http://google.com ] kuliu", want: "http://google.com"},
        {
            name: "considers only last url",
            in: "multiple urls [bla www.first.com asdfasdf www.second.com truc]",
            want: "www.second.com"
        },
    ]

    for (const test of tests) {
        it(test.name, function () {
            expect(lastUrlFromString(test.in)).toBe(test.want)
        });
    }
})

describe("titleFromResponse", function () {
    const tests = [
        {name: "undefined  on no title tag", in: "notgoingtofindme", want: undefined},
        {name: "finds first title", in: "gliughi<title> title1</title>kuhliuhl<title>title2</title>", want: "title1"},
    ]

    for (const test of tests) {
        it(test.name, function () {
            expect(titleFromResponse(test.in)).toBe(test.want)
        });
    }
})

describe("emailFromResponse", () => {
    const tests = [
        {name: "undefined on no email found", in: "bbbbbbbbb", want: undefined},
        {name: "ignores images", in: "image@80xauto.jpg", want: undefined},
        {name: "recognizes email", in: "bbbbbb email@email.com hhh", want: "email@email.com"},
        {name: "recognizes email", in: "div>email@email.com</", want: "email@email.com"},
        {name: "recognizes email", in: " @email@email.com", want: "email@email.com"},
        {name: "only considers first email", in: "bbb right@email.com bbbb wrong@wmail.com", want: "right@email.com"},
        {
            name: "finds first email in string with image",
            in: "bbb image@80xauto.jpg right@email.com bbbb wrong@wmail.com",
            want: "right@email.com"
        },
    ]

    for (const test of tests) {
        it(test.name, function () {
            expect(emailFromResponse(test.in)).toBe(test.want)
        });
    }
})

describe.only("reqOpts", () => {
    it('should throw on undefined or empty url provided', function () {
        expect(() => reqOpts("")).toThrow("url is required")
        expect(() => reqOpts()).toThrow("url is required")
    });


    const tests = [
        {
            name: "correctly parses http:// urls",
            in: "http://google.com",
            want: {hostname: "google.com", port: 80, path: "/"},
        },
        {
            name: "correctly parses https:// urls",
            in: "https://google.com",
            want: {hostname: "google.com", port: 443, path: "/"},
        },
        {
            name: "correctly parses www urls",
            in: "www.google.com",
            want: {hostname: "www.google.com", port: 443, path: "/"},
        },
        {
            name: "correctly parses paths",
            in: "www.google.com/some/path",
            want: {hostname: "www.google.com", port: 443, path: "/some/path"},
        },
    ]

    for (const test of tests) {
        it(test.name, function () {
            expect(reqOpts(test.in)).toEqual(test.want)
        });
    }
})