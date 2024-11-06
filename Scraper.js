// scraper.js
const axios = require('axios');
const cheerio = require('cheerio');

function Scraper() {

    this.url = "https://www.apple.com/ca/shop/refurbished/mac"

    const scrapeProductSpecs = async (url) => {
        try {
            const { data } = await axios.get(url);333
            let $ = cheerio.load(data);
            $ = cheerio.load($.text());

            const techSpecs = [];
            const techSpecPartsChildren = $('.TechSpecs-panel').find('.rc-pdsection-mainpanel').children();

            let spec = {
                title: "",
                specList: []
            }

            techSpecPartsChildren.each((index, element) => {
                const el = $(element);
                const elText = el.text().trim().replace(/\u00a0/g, " ");

                if (el.hasClass('h4-para-title')) {
                    spec.title = elText;
                }

                if (el.hasClass('para-list')) {
                    spec.specList.push(elText);
                }

                if (el.hasClass('as-pdp-lastparalist')) {
                    techSpecs.push({...spec});
                    spec.title = "";
                    spec.specList = [];
                }
            });

            return techSpecs;
        } catch (error) {
            console.error('Error fetching the URL:', error);
        }
    }

    const parseProductSpecs = (specs) => {
        let screenSize = null;
        let chip = null;
        let memory = null;
        let storage = null;

        specs.forEach(section => {
            if (section.title === 'Display') {
                const displaySpec = section.specList.find(spec => spec.includes('inch'));
                if (displaySpec) {
                    const sizeMatch = displaySpec.match(/(\d+\.*\d+)-inch/);
                    if (sizeMatch) {
                        screenSize = sizeMatch[1];
                    }
                }
            }

            if (section.title === 'Chip') {
                const chipSpec = section.specList[0];
                const chipMatch = chipSpec.match(/Apple\s(M[0-9]+(?:\s(Pro|Max|Ultra))*)/);
                if (chipMatch) {
                    chip = chipMatch[1];
                }
            }

            if (section.title === 'Memory') {
                const memorySpec = section.specList[0];
                const memoryMatch = memorySpec.match(/(\d+)GB/);
                if (memoryMatch) {
                    memory = memoryMatch[1];
                }
            }

            if (section.title === 'Storage') {
                const storageSpec = section.specList[0];
                const storageMatch = storageSpec.match(/(\d+)(GB|TB)/);
                if (storageMatch) {
                    const storageValue = storageMatch[1];
                    const storageMultiplier = storageMatch[2] === "TB" ? 1024 : 1
                    storage = storageValue * storageMultiplier;
                }
            }
        });

        return { screenSize, chip, memory, storage };
    }

    const parseColor = (name) => {
        const colorRegex = / - (.+)$/;
        const match = name.match(colorRegex);
        if (match) {
            return match[1].trim();
        }
        return null;
    };

    const parseProductType = (name) => {
        const productKeywords = [
            "MacBook Air",
            "MacBook Pro",
            "iMac",
            "Mac mini",
            "Mac Studio",
            "Mac Pro",
            "Apple Studio Display"
        ];
        const lowerTitle = name.toLowerCase();

        for (const keyword of productKeywords) {
            if (lowerTitle.includes(keyword.toLowerCase())) {
                return keyword;
            }
        }
        return "Unknown Product Type";
    };

    this.scrape = async () => {
        try {
            const { data } = await axios.get(this.url);
            const $ = cheerio.load(data);
            const products = [];

            const scrapePromises = []

            $('script[type="application/ld+json"]').each((index, element) => {
                const jsonData = $(element).html();
                if (jsonData) {
                    try {
                        const rawData = JSON.parse(jsonData);
                        // Create a promise for the async operation
                        const promise = (async () => {
                            if (rawData.offers) {
                                const fullSpecs = await scrapeProductSpecs(rawData.url);
                                let { screenSize, chip, memory, storage } = parseProductSpecs(fullSpecs);
                                rawData.name = rawData.name.replace(/\u00a0/g, " ");
                                products.push({
                                    sku: rawData.offers[0].sku,
                                    name: rawData.name,
                                    type: parseProductType(rawData.name),
                                    mostRecentPrice: rawData.offers[0].price,
                                    priceCurrency: rawData.offers[0].priceCurrency,
                                    isAvailable: true,
                                    image: rawData.image,
                                    description: rawData.description,
                                    fullSpecs: JSON.stringify(fullSpecs),
                                    screenSize: screenSize,
                                    chip: chip,
                                    memory: memory,
                                    storage: storage,
                                    color: parseColor(rawData.name),
                                    url: rawData.url
                                });
                            }
                        })();
                        scrapePromises.push(promise);
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                    }
                }
            });

            await Promise.all(scrapePromises);
            return products;
        } catch (error) {
            console.error('Error fetching the webpage:', error);
            return [];
        }
    };

}

module.exports = Scraper;
