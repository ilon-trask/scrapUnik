import cheerio from "cheerio";
import fs from "fs";

const baseUrl = "";

async function takeLinks(link: string) {
  const resLinks: string[] = [];
  const rawData = await fetch(link);
  const html = await rawData.text();
  const $ = cheerio.load(html);
  $("div.hide > a").each((i, el) => {
    const regex = new RegExp("Roster");
    const a = $(el);
    if (regex.test(a.text())) {
      //@ts-ignore
      resLinks.push(a.attr().href);
    }
  });
  return resLinks;
}

async function takeLinksWithYears(link: string) {
  const yearLinks: string[] = [];
  const rawData = await fetch(link);
  const html = await rawData.text();
  const $ = cheerio.load(html);

  $("select#ddl_past_rosters > option")
    .slice(0, 4)
    .each((i, el) => {
      yearLinks.push(el.attribs.value);
    });
  return yearLinks;
}

type dataType = {
  sport: string;
  year: string;
  sex: string;
  name: string;
  weight: string;
  height: string;
  acYear: string;
  hometown: string;
  highschool: string;
  prevHighschool: string;
  xLink: string;
  instagramLink: string;
};

async function funcName(link: string) {
  const some = await fetch(link);
  const $ = cheerio.load(await some.text());
  const innerData: dataType[] = [];
  $("div.sidearm-roster-player-container").each((i, el) => {
    const name = $(el).find("h3>a").text();
    const weight = $(el).find(".sidearm-roster-player-weight").text();
    const height = $(el).find(".sidearm-roster-player-height").text();
    const acYear = $(el).find(".sidearm-roster-player-academic-year").text();
    const hometown = $(el).find(".sidearm-roster-player-hometown").text();
    const highschool = $(el).find(".sidearm-roster-player-highschool").text();
    const prevHighschool = $(el)
      .find(".sidearm-roster-player-previous-school")
      .text();
    const socialHtml = $(el).find(".sidearm-roster-player-social").find("a");
    let instagramLink = "";
    let xLink = "";
    socialHtml.each((i, el) => {
      //@ts-ignore
      const href: string = $(el).attr().href;
      if (href.includes("instagram")) {
        instagramLink = href;
      }
      if (href.includes("twitter") || href.includes("x.com")) {
        xLink = href;
      }
    });
    const urlData = link.split("/");
    const sport = urlData[4];
    let sex = sport.split("-")[0];

    if (sex != "mens" && sex != "womens") {
      sex = "man";
    } else if (sex == "mens") {
      sex = "man";
    } else {
      sex = "woman";
    }

    innerData.push({
      sport,
      year: urlData[6],
      sex,
      name,
      weight,
      height,
      acYear,
      hometown,
      highschool,
      prevHighschool,
      instagramLink,
      xLink,
    });
  });
  return innerData;
}

(async () => {
  const partUrl = await takeLinks(baseUrl);
  const links = partUrl.map((el) => baseUrl + el);
  console.log(links);
  const yearLinks: string[][] = [];
  for (let i = 0; i < links.length; i++) {
    const el = links[i];
    yearLinks.push(await takeLinksWithYears(el));
  }
  console.log(yearLinks);
  const fullLinks = yearLinks.flat().map((el) => baseUrl + el);
  const newData = await Promise.all(fullLinks.map(funcName));
  console.log(newData.flat());
  fs.writeFile("data.json", JSON.stringify(newData.flat()), () => {});
})();
