export type GuideEntry = {
  slug: string;
  title: string;
  description: string;
};

/** Titel und Kurzbeschreibung der veröffentlichten Beiträge, für die Suche im Browser. */
export const GUIDE_CATALOG: readonly GuideEntry[] = [
  { slug: "cold-brew-flasche", title: "Cold-Brew-Flasche: kalt aufgießen, welche Tees, welches Glas", description: "Wie kalter Teeaufguss funktioniert, welches Glas oder welche Flasche dazu passt, und welche Sorten auf Teelotse sich dafür eignen." },
  { slug: "gaiwan", title: "Gaiwan: die kleine Schale mit Deckel, Material und Größe", description: "Was ein Gaiwan ist, wie du mit der kleinen Schale mit Deckel aufgießt, und welches Material und welche Größe dazu passen." },
  { slug: "teethermometer", title: "Teethermometer: warum die Wassertemperatur den Geschmack trifft", description: "Warum die Wassertemperatur den Aufguss verändert, welche Thermometer es gibt, und die Stufen aus dem Teelotse-Datensatz." },
  { slug: "thermoskanne-fuer-tee", title: "Thermoskanne für Tee: Sieb, Material, Wärme, Reinigung", description: "Worauf du bei einer Thermoskanne oder Isolierflasche für Tee achtest: Siebeinsatz, Material, Wärme und das Spülen danach." },
  { slug: "teedose-fuer-losen-tee", title: "Teedose für losen Tee: luftdicht, dunkel, welches Material", description: "Welche Dose losen Tee luftdicht und dunkel hält: Metall, Innendeckel, Sets, Keramik nur mit dichtem Deckel." },
  { slug: "welche-teekanne-kaufen", title: "Welche Teekanne kaufen: Glas, Porzellan oder Gusseisen", description: "Welche Kanne losen Tee für mehrere Tassen aufnimmt: Glas mit Sieb, Porzellan, Gusseisen mit Emaille, Größe und Pflege." },
  { slug: "earl-grey", title: "Earl Grey: Herkunft, Geschmack und Zubereitung", description: "Earl Grey als Schwarztee mit Bergamotte: zitronig-herb, Koffein auf hoch, 90–95 °C und 3 Minuten." },
  { slug: "loser-tee-oder-teebeutel", title: "Loser Tee oder Teebeutel", description: "Was loser Tee an Sieb, Waage und Menge braucht und wann ein Beutel die einfachere Tasse ist." },
  { slug: "matcha-starterset", title: "Matcha-Starterset: was du wirklich brauchst", description: "Bambusbesen, Schale, Sieb und Waage für Matcha, mit Temperatur und Menge aus dem Teelotse-Datensatz." },
  { slug: "rooibos", title: "Rooibos: Herkunft, Geschmack und Zubereitung", description: "Rooibos aus Südafrika: rotbuschig, mild und holzig-süß, im Datensatz koffeinfrei, 100 °C und 5–7 Minuten." },
  { slug: "sencha", title: "Sencha: Herkunft, Geschmack und Zubereitung", description: "Sencha aus Japan: grasig-herbe Note, Koffein auf mittel, 70–80 °C und 60–90 Sekunden aus dem Datensatz." },
  { slug: "teesieb-oder-teekanne", title: "Teesieb oder Teekanne mit Sieb", description: "Wann ein Teesieb in der Tasse reicht und wann eine Kanne mit Siebeinsatz mehrere Tassen aus einem Ziehen nimmt." },
  { slug: "wasserkocher-fuer-tee", title: "Welcher Wasserkocher für Tee", description: "Temperaturstufen am Wasserkocher und welche Gradzahl im Datensatz zu Sencha, Matcha, Schwarztee und Rooibos steht." },
  { slug: "tee-zubereiten", title: "Tee zubereiten: Wasser, Menge, Ziehzeit im Überblick", description: "Temperatur, Menge und Ziehzeit je Sorte aus dem Teelotse-Datensatz, mit den Handgriffen an Kanne, Sieb und Wasserkocher." },
  { slug: "welche-teesorte-moment", title: "Welche Teesorte passt zu welchem Moment", description: "Sechs Momente auf Teelotse, die Sorten in jeder Liste und wie Geschmack und Koffein die Auswahl eingrenzen." },
];
