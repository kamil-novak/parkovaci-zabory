// -----------------------------------------------------------------------------------
// NASTAVENÍ MAPOVÉ APLIKACE 
// Vybraná nastavení lze provádět pomocí tohoto konfiguračního souboru (viz komentáře)
// Jiná nastavení je nutné provádět přímo v aplikaci
// -----------------------------------------------------------------------------------

var config = {

    variable1: "",
    variable2: "",
    
    // Text v horní liště mapové aplikace
    headerTitle: "Zákresy parkovacích záborů",
    
    // Odkaz pod logem v horní liště aplikace
    headerLink: "https://www.jihlava.cz/projekty-pro-verejnost/d-465410",

    // ID webové mapy
    webmapId: "56ea098b533f428eacef5ad58571e693",

    // ID editační služby
    editLayerId: "OD_parkovani_zabory_2008",

    // Souřadnicový systém webov mapy ( kód EPSG )
    webmapSpatialReference: 5514,

    // Portal URL
    portalUrl: "https://gis.jihlava-city.cz/portal",

    // Zapnutí snappingu na feature vrstvách při inicializaci aplikaci (layer ID)
    snappLayersOnStart: ["OD_parkovani_zabory_2008", "OD_parkovani_zabory_2753"],

    // Obsah widgetu o aplikaci (HTML)
    infoWidgetContent: "<div class='about-widget'><h3>Zákresy parkovacích záborů</h3><div><h4>Obsah mapové aplikace</h4><p>Lorem ipsum reprehenderit non officia nulla elit id. Officia laboris ipsum deserunt nostrud consequat incididunt qui tempor cillum veniam exercitation consectetur veniam. Reprehenderit elit laboris eiusmod nostrud commodo aliquip ipsum irure laborum qui reprehenderit id. Sint Lorem velit sunt cupidatat ipsum quis quis consectetur Lorem deserunt deserunt proident nucalcitella esse.</p></div></div>",
};