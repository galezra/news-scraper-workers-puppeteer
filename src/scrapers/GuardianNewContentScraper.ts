import  {PuppeteerScraper} from './PuppeteerScraper'
import htmlToText from 'html-to-text'
import {NewScrapedI} from "../models/NewScraped";
import {ScrapingIndexI} from "../models/ScrapingIndex";
import {ContentScraper} from "./ContentScraper";
import {v4} from 'uuid'

export class GuardianNewContentScraper extends ContentScraper {
    public timeWaitStart: number
    public timeWaitClick: number
    public newspaper: string
    public scraperId: string
    public excludedParagraphs:string[] = []

    constructor(scraperId: string, newspaper:string) {
        super();
        this.newspaper = newspaper
        this.scraperId = scraperId
        this.timeWaitStart = 1 * 1000
        this.timeWaitClick = 500
    }

    async extractNewInUrl(url: string):Promise<NewScrapedI> {
        // https://www.theguardian.com/film/2021/jan/06/ham-on-rye-review-subversive-satire
        console.log("\n---");
        console.log("extracting full new in url:")
        console.log(url);
        console.log("---");

        try {
            await this.initializePuppeteer();
        } catch (e) {
            console.log("error initializing")
        }
        try {
            try {
                await this.page.goto(url, {waitUntil: 'load', timeout: 0});
            } catch (e){
                return {} as NewScrapedI
            }

            const div = await this.page.$('div.pg-rail-tall__body');
            const [headline, content, date, author, image, tags] = await Promise.all([this.extractHeadline(), this.extractBody(div), this.extractDate(), this.extractAuthor(), this.extractImage(), this.extractTags()])

            await this.browser.close();
            await this.page.waitFor(this.timeWaitStart);

            let results = {id:v4(), url,content, headline, tags, date, image,author, scraperId:this.scraperId, newspaper:this.newspaper, scrapedAt:new Date()} as NewScrapedI
            return results;

        } catch (err) {
            console.log(err);
            await this.page.screenshot({ path: 'error_extract_new.png' });
            await this.browser.close();
            return null;
        }
    }

    async extractBody(div: any){
        try{
            const pars = await this.page.$$(".css-38z03z")
            let text = ''
            for (let par of pars) {
                const textPar = await this.page.evaluate(element => element.textContent, par);
                const hasExcludedText = this.excludedParagraphs.some((text)=>textPar.includes(text))
                if (!hasExcludedText) {
                    text = text + '\n ' + textPar
                }
            }
            return text
        } catch (e){
            console.log(e)
            return null
        }

    }

    cleanUp = (text: string) => {
        return text.replace(/\n/g, " ")
    }

    async extractDate(): Promise<Date> {
        try {
            let date = await this.page.$eval("head > meta[property='article:published_time']", (element:any) => element.content);
            date =  new Date(date)
            return date
        } catch (e) {
            return null
        }

    }
    async extractTags(): Promise<string[]> {
        try{
            let tags = await this.page.$eval("head > meta[property='article:tag']", (element:any) => element.content);
            if (tags && tags.includes(",")){
                return tags.split(",").map((elem:string) => (elem.trim()))
            }
            return [tags]
        } catch (e) {
            return null
        }

    }


    async extractHeadline() {
        try{
            let headline = await this.page.$eval("head > meta[property='og:title']", (element:any) => element.content);
            return headline
        } catch (e) {
            return null
        }

    }

    async extractAuthor() {
        try{
            let headline = await this.page.$eval("head > meta[property='article:author']", (element:any) => element.content);
            return headline
        } catch (e) {
            return null
        }

    }

    async extractImage() {
        try{
            let headline = await this.page.$eval("head > meta[property='og:image']", (element:any) => element.content);
            return headline
        } catch (e) {
            return null
        }

    }


    async clickOkButtonCookie () {
        try {
            const frame = this.page.frames()
            //frame[2].click('button[title="Fine By Me!"]');
        } catch (e) {

        }


    }

}
