import {
    ScrapingIndexDocument,
    ScrapingIndexI,
} from './models/ScrapingIndex';

import {ContentScraper} from "./scrapers/ContentScraper";
import {IndexScraper} from "./scrapers/IndexScraper";
import {TheSunNewIndexScraper} from "./scrapers/TheSunNewIndexScraper";
import {TheSunNewContentScraper} from "./scrapers/TheSunNewContentScraper";

import mongoose from 'mongoose';
import scrapingConfig from './config/scrapingConfigFull.json';
import {BBCNewIndexScraper} from "./scrapers/BBCNewIndexScraper";
import {BBCNewContentScraper} from "./scrapers/BBCNewContentScraper";
import {CnnNewContentScraper} from "./scrapers/CnnNewContentScraper";
import {CnnNewIndexScraper} from "./scrapers/CnnNewIndexScraper";
import {GuardianNewContentScraper} from "./scrapers/GuardianNewContentScraper";
import {GuardianNewIndexScraper} from "./scrapers/GuardianNewIndexScraper";
import {UsatodayNewContentScraper} from "./scrapers/UsatodayNewContentScraper";
import {UsatodayNewIndexScraper} from "./scrapers/UsatodayNewIndexScraper";
import {initDb} from "./models/sequelizeConfig";
import PersistenceManager from "./PersistenceManager";
import {GlobalConfigI} from "./models/GlobalConfig";
import {NewYorkTimesContentScraper} from "./scrapers/NewYorkTimesContentScraper";
import {NewYorkTimesIndexScraper} from "./scrapers/NewYorkTimesIndexScraper";
import {LATimesContentScraper} from "./scrapers/LATimesContentScraper";
import {LATimesIndexScraper} from "./scrapers/LATimesIndexScraper";

require('dotenv').config();
mongoose.connect(process.env["MONGODB_URL"], {useNewUrlParser: true, useUnifiedTopology: true});

export interface ScraperTuple {
    pageScraper: ContentScraper;
    urlSectionExtractorScraper: IndexScraper;
}

export default class ScraperApp {
    public config: any = scrapingConfig as any

    public scrapers: ScraperTuple[] = [];
    public joiningStr = "===="
    public scrapingIndex: ScrapingIndexDocument;
    public globalConfig: GlobalConfigI;
    public persistenceManager: PersistenceManager
    constructor() {
    }

    async loadIndexAndScrapers() {

        this.persistenceManager = new PersistenceManager(this.config)
        await this.prepareGlobalConfig()

        const newspapersReordered = this.reorderNewspaperArrayStartingWithLastScraped()

        for (let newspaper of newspapersReordered) {
            console.log("loading index for " + newspaper)

            if (newspaper === "latimes") {
                const indexScraper = await this.prepareIndex(newspaper)
                console.log(indexScraper)
                const scraper = {
                    pageScraper: new LATimesContentScraper(indexScraper.scraperId, indexScraper.newspaper),
                    urlSectionExtractorScraper: new LATimesIndexScraper(indexScraper)
                } as ScraperTuple
                this.scrapers.push(scraper)
            }

            if (newspaper === "newyorktimes") {
                const indexScraper = await this.prepareIndex(newspaper)
                console.log(indexScraper)
                const scraper = {
                    pageScraper: new NewYorkTimesContentScraper(indexScraper.scraperId, indexScraper.newspaper),
                    urlSectionExtractorScraper: new NewYorkTimesIndexScraper(indexScraper)
                } as ScraperTuple
                this.scrapers.push(scraper)
            }

            if (newspaper === "guardianus") {
                const indexScraper = await this.prepareIndex(newspaper)
                console.log(indexScraper)
                const scraper = {
                    pageScraper: new GuardianNewContentScraper(indexScraper.scraperId, indexScraper.newspaper),
                    urlSectionExtractorScraper: new GuardianNewIndexScraper(indexScraper)
                } as ScraperTuple
                this.scrapers.push(scraper)
            }

            if (newspaper === "usatoday") {
                const indexScraper = await this.prepareIndex(newspaper)
                const scraper = {
                    pageScraper: new UsatodayNewContentScraper(indexScraper.scraperId, indexScraper.newspaper),
                    urlSectionExtractorScraper: new UsatodayNewIndexScraper(indexScraper)
                } as ScraperTuple
                this.scrapers.push(scraper)
            }
            if (newspaper === "guardianuk") {
                const indexScraper = await this.prepareIndex(newspaper)
                const scraper = {
                    pageScraper: new GuardianNewContentScraper(indexScraper.scraperId, indexScraper.newspaper),
                    urlSectionExtractorScraper: new GuardianNewIndexScraper(indexScraper)
                } as ScraperTuple
                this.scrapers.push(scraper)
            }

            if (newspaper === "cnn") {
                const indexScraper = await this.prepareIndex(newspaper)
                const scraper = {
                    pageScraper: new CnnNewContentScraper(indexScraper.scraperId, indexScraper.newspaper),
                    urlSectionExtractorScraper: new CnnNewIndexScraper(indexScraper)
                } as ScraperTuple
                this.scrapers.push(scraper)
            }

            if (newspaper === "bbc") {
                const indexScraper = await this.prepareIndex(newspaper)
                const scraper = {
                    pageScraper: new BBCNewContentScraper(indexScraper.scraperId, indexScraper.newspaper),
                    urlSectionExtractorScraper: new BBCNewIndexScraper(indexScraper)
                } as ScraperTuple
                this.scrapers.push(scraper)
            }

            if (newspaper === "thesunuk" || newspaper === "thesunus") {
                const indexScraper = await this.prepareIndex(newspaper)
                const scraper = {
                    pageScraper: new TheSunNewContentScraper(indexScraper.scraperId, indexScraper.newspaper),
                    urlSectionExtractorScraper: new TheSunNewIndexScraper(indexScraper)
                } as ScraperTuple
                this.scrapers.push(scraper)
            }
        }

    }
    async prepareGlobalConfig() {
        let globalConfig = await this.persistenceManager.findCurrentGlogalConfig()
        if (globalConfig) {
            this.globalConfig = globalConfig
        } else {
            globalConfig = {} as GlobalConfigI
            globalConfig.scraperId = this.config.scraperId
            globalConfig.deviceId = this.config.deviceId
            globalConfig.lastNewspaper = this.config.newspapers[0]
            globalConfig.lastActive = new Date()
            this.globalConfig = globalConfig
            await this.persistenceManager.updateGlobalConfig(globalConfig)
        }
    }

    reorderNewspaperArrayStartingWithLastScraped():string[] {
        const currentNewspaper = this.globalConfig.lastNewspaper
        const index = this.config.newspapers.indexOf(currentNewspaper)
        const newspapersReordered = this.config.newspapers.slice(index).concat(this.config.newspapers.slice(0, index))
        return newspapersReordered
    }

    async refreshGlobalConfigFromIndex(index: ScrapingIndexI) {
        this.globalConfig.lastNewspaper = index.newspaper
        this.globalConfig.lastActive = new Date()
        await this.persistenceManager.updateGlobalConfig(this.globalConfig)

    }

    async prepareIndex(newspaper: string): Promise<ScrapingIndexI> {
        let indexScraper = await this.persistenceManager.findCurrentIndex(newspaper)
        if (!indexScraper || !indexScraper.scraperId) {
            console.log(indexScraper)
            indexScraper = this.loadIndexFromConfig(newspaper)
        }

        await this.persistenceManager.updateIndex(indexScraper)
        return indexScraper

    }


    loadIndexFromConfig(newspaper: string): ScrapingIndexI {
        console.log("@---------------------------------------@")
        console.log("loading from config")
        console.log("@---------------------------------------@")
        const indexScraper = {} as ScrapingIndexI
        indexScraper.urlIndex = 0
        indexScraper.startingUrls = this.config.scrapingSettings[newspaper].startingUrls
        indexScraper.pageNewIndex = 1
        indexScraper.newspaper = newspaper
        indexScraper.scraperId = this.config.scraperId
        indexScraper.deviceId = this.config.deviceId
        indexScraper.maxPages = this.config.scrapingSettings[newspaper].maxPages
        return indexScraper
    }

    async startScraper() {
        await initDb()

        await this.loadIndexAndScrapers()
        let continueScraping = true;

        while (continueScraping) for (let scraperTuple of this.scrapers) {
            try {
                await this.scrapOneIterationFromOneScraper(scraperTuple)
            } catch (e) {
                console.log("----------------------------------")
                console.log("ERROR")
                console.log(e)
                console.log("----------------------------------")
            }
        }
    }

    async scrapOneIterationFromOneScraper(scraperTuple: ScraperTuple) {
        await this.refreshGlobalConfigFromIndex(scraperTuple.urlSectionExtractorScraper.scrapingIndex)

        const urls = await scraperTuple.urlSectionExtractorScraper.extractNewsUrlsInSectionPageFromIndexOneIteration()
        console.log("starting scraping urls ")
        console.log(urls)

        if (scraperTuple.urlSectionExtractorScraper.scrapingIndex.pageNewIndex >= urls.length - 1) {
            console.log("RESETING_____________")
            scraperTuple.urlSectionExtractorScraper.scrapingIndex.pageNewIndex = 1
            await this.persistenceManager.updateIndex(scraperTuple.urlSectionExtractorScraper.scrapingIndex)
        }

        while (scraperTuple.urlSectionExtractorScraper.scrapingIndex.pageNewIndex <= urls.length - 1) {
            scraperTuple.urlSectionExtractorScraper.scrapingIndex = scraperTuple.urlSectionExtractorScraper.scrapingIndex

            const url = urls[scraperTuple.urlSectionExtractorScraper.scrapingIndex.pageNewIndex]
            if (url) {
                console.log("*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-")
                console.log("scraping url " + "page: " + scraperTuple.urlSectionExtractorScraper.scrapingIndex.pageNewIndex + " url number: " + scraperTuple.urlSectionExtractorScraper.scrapingIndex.urlIndex)
                console.log(url)
                console.log("*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-")

                let extractedNews = await scraperTuple.pageScraper.extractNewInUrl(url, scraperTuple.urlSectionExtractorScraper.scrapingIndex.scraperId)
                console.log(extractedNews)
                await this.persistenceManager.saveNewsScraped(extractedNews)
            }

            scraperTuple.urlSectionExtractorScraper.scrapingIndex.pageNewIndex = scraperTuple.urlSectionExtractorScraper.scrapingIndex.pageNewIndex + 1
            await this.persistenceManager.updateIndex(scraperTuple.urlSectionExtractorScraper.scrapingIndex)
            await this.refreshGlobalConfigFromIndex(scraperTuple.urlSectionExtractorScraper.scrapingIndex)
        }

        await this.setUpNextIteration(scraperTuple)
    }

    async setUpNextIteration(scraperTuple: ScraperTuple) {
        scraperTuple.urlSectionExtractorScraper.scrapingIndex.urlIndex = scraperTuple.urlSectionExtractorScraper.scrapingIndex.urlIndex + 1
        scraperTuple.urlSectionExtractorScraper.scrapingIndex.pageNewIndex = 1
        scraperTuple.urlSectionExtractorScraper.scrapingIndex.pageIndexSection = 1

        if (scraperTuple.urlSectionExtractorScraper.scrapingIndex.urlIndex > scraperTuple.urlSectionExtractorScraper.scrapingIndex.startingUrls.length - 1) {
            scraperTuple.urlSectionExtractorScraper.scrapingIndex.urlIndex = 0
        }

        await this.persistenceManager.updateIndex(scraperTuple.urlSectionExtractorScraper.scrapingIndex)
    }


} 