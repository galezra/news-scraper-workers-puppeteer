"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const IndexScraper_1 = require("./IndexScraper");
class BBCNewIndexScraper extends IndexScraper_1.IndexScraper {
    constructor(scrapingIndex) {
        super();
        this.urls = [];
        this.scrapingIndex = scrapingIndex;
        this.timeWaitStart = 1 * 1000;
        this.timeWaitClick = 500;
        this.maxPages = scrapingIndex.maxPages;
    }
    extractNewsUrlsInSectionPageFromIndexOneIteration() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.scrapingIndex.urlIndex > this.scrapingIndex.startingUrls.length - 1) {
                this.scrapingIndex.urlIndex = 0;
                this.scrapingIndex.pageNewIndex = 1;
                this.scrapingIndex.pageIndexSection = 1;
            }
            const currentUrl = this.scrapingIndex.startingUrls[this.scrapingIndex.urlIndex];
            const extractedUrls = yield this.extractUrlsFromStartingUrl(currentUrl);
            const uniqUrls = [...new Set(extractedUrls)];
            return uniqUrls;
        });
    }
    extractUrlsFromStartingUrl(url) {
        return __awaiter(this, void 0, void 0, function* () {
            //https://www.thesun.co.uk/tv
            if (!this.scrapingIndex.pageIndexSection || this.scrapingIndex.pageIndexSection < 2) {
                this.scrapingIndex.pageIndexSection = 2;
            }
            while (this.scrapingIndex.pageIndexSection <= this.maxPages - 1) {
                try {
                    const urls = yield this.extractUrlsInPage(url, this.scrapingIndex.pageIndexSection);
                    this.urls = this.urls.concat(urls);
                    this.scrapingIndex.pageIndexSection = this.scrapingIndex.pageIndexSection + 1;
                }
                catch (e) {
                    console.log(e);
                    this.scrapingIndex.pageIndexSection = 2;
                    return this.urls;
                }
            }
            this.scrapingIndex.pageIndexSection = 2;
            return this.urls;
        });
    }
    extractUrlsInPage(url, page) {
        return __awaiter(this, void 0, void 0, function* () {
            // https://www.thesun.co.uk/tv/page/1/
            const pageUrl = url + "/page/" + page + "/";
            console.log("\n************");
            console.log("extracting full index in url:");
            console.log(pageUrl);
            console.log("************");
            const urls = [];
            yield this.initializePuppeteer();
            try {
                yield this.page.goto(pageUrl, { waitUntil: 'load', timeout: 0 });
                yield this.page.waitFor(this.timeWaitStart);
                yield this.clickOkButtonCookie();
                const urlsInPage = yield this.extractUrlsFromPage();
                yield this.browser.close();
                yield this.page.waitFor(this.timeWaitStart);
                return urlsInPage;
            }
            catch (err) {
                console.log(err);
                yield this.page.screenshot({ path: 'error_extract_new.png' });
                yield this.browser.close();
                throw err;
            }
        });
    }
    clickOkButtonCookie() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const frame = this.page.frames();
                //frame[2].click('button[title="Fine By Me!"]');
            }
            catch (e) {
            }
        });
    }
    extractUrlsFromPage() {
        return __awaiter(this, void 0, void 0, function* () {
            const hrefs = yield this.page.$$eval('a.qa-story-image-link', (as) => as.map((a) => a.href));
            return hrefs;
        });
    }
}
exports.BBCNewIndexScraper = BBCNewIndexScraper;
//# sourceMappingURL=BBCNewIndexScraper.js.map