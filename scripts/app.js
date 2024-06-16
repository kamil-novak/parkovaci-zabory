// ARCGIS JS API MODULS ---
require([
    "esri/WebMap",
    "esri/views/MapView",
    "esri/widgets/Popup",
    "esri/core/reactiveUtils",
    "esri/widgets/Expand",
    "esri/widgets/Home",
    "esri/widgets/Locate",
    "esri/widgets/Locate/LocateViewModel",
    "esri/widgets/BasemapGallery/support/LocalBasemapsSource",
    "esri/layers/TileLayer",
    "esri/Basemap",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Search",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/geometry/Point",
    "esri/layers/MapImageLayer",
    "esri/request",
    "esri/widgets/Feature",
    "esri/widgets/Sketch/SketchViewModel",
    "esri/widgets/Editor",
    "esri/geometry/Polyline",
    "esri/geometry/geometryEngine"
   ], function(WebMap, MapView, Popup, reactiveUtils, Expand, Home, Locate, LocateVM, LocalBasemapsSource, TileLayer, Basemap, BasemapGallery, Search, FeatureLayer, GraphicsLayer, Graphic, Point, MapImageLayer, esriRequest, Feature, SketchViewModel, Editor, Polyline, geometryEngine) {

    // GLOBAL VARIABLES ---
    let sketchViewModel = null;

    // Sketching state
    let sketchingState = false;

    // Form state
    let formState = {
      geometry: null,
      category: null,
      description: null,
      email: null,
      attachment: null,
      attachmentData: null
    };

    // DOM ---
    // MESSAGES
    const messageSelectPlace = `
      <div class="problems-map-message-select problems-info">
        
      </div>`
       
    // APP lAYOUT ---
    // Header bar
    document.querySelector(".title-container").innerHTML = config.headerTitle;
    document.querySelector(".logo-container").innerHTML = 
      `<a href="${config.headerLink}" target="_blank">
        <img class="logo-image" src="images/header-logo-jihlava.svg" alt="logo">
      </a>`;

    // WEBMAP ---
    // Basemaps
    // Ortofoto
    const BaseMapDefault = new Basemap({
      baseLayers: [
        new TileLayer({
          url: "https://gis.jihlava-city.cz/server/rest/services/basemaps/ORP_ortofoto/MapServer",
          opacity: 0.9999,
          title: "Letecká mapa",
        })
      ],
      title: "Letecká mapa",
      thumbnailUrl: "images/bm-letecka-aktual.png"
    });
    // Světlá
    const BaseMap_1 = new Basemap({
      portalItem: {
        id: "4e61460704134188abf1dc3bca76cea6",
        portal: {
          url: "https://gis.jihlava-city.cz/portal"
        },
      },
      title: "Základní mapa - světlá",
      thumbnailUrl: "images/bm-zakladni-svetla.png"
    });
    // Zabaged
    const BaseMap_2 = new Basemap({
      portalItem: {
        id: "8b5c0e7b0e4c4fdb8ee107c1e7ecd0e9",
        portal: {
          url: "https://gis.jihlava-city.cz/portal"
        }
      },
      title: "Základní mapa",
      thumbnailUrl: "images/bm-zakladni.png"
    });

    // Search layers
    // Base layer
    const SearchLayerDefault = new FeatureLayer({
      url: "https://gis.jihlava-city.cz/server/rest/services/ost/ORP_RUIAN/MapServer/0",
      outFields: ["adresa, adresa_o"],
      definitionExpression: "obec_kod=586846"
    })

    // WebMap
    var map = new WebMap({
      basemap: BaseMapDefault,
      portalItem: { 
        portal: {
          url: config.portalUrl
        },
        id: config.webmapId
      }
    });

    // View
    var view = new MapView({
      container: "viewDiv",
      map,
      padding: { top: 55 },
      popup: new Popup({
        visibleElements: {
          actionBar: false, // Disable popup actions since JS SDK v. 4.29
        },
        viewModel: {
          includeDefaultActions: false // Disable popup actions before JS SDK v. 4.29
        }
      }),
      extent: {
        xmin: -670774.494788529,
        ymin: -1131457.7806157435,
        xmax: -668422.3442508945,
        ymax: -1128306.586813356,
        spatialReference: config.webmapSpatialReference
      },
      constraints: {
        minScale: 500000,
        maxScale: 25
      }
    });

    // Label layer
    const LabelLayer = new GraphicsLayer({})
      
    // Edit layer
    /* const EditLayer = new FeatureLayer({
      url: config.editFeatureUrl,
      outFields: ["*"]
    }) */
    
    // Locate layer
    const locateLayer = new GraphicsLayer();
  
    // Operation layers
    let OperationalLayer_1 = null; 
    let OperationalLayer_2 = null; 
    let OperationalLayer_3 = null; 
    let OperationalLayer_4 = null; 

    // MAIN CODE
    // After view is loaded    
    reactiveUtils.once( () => view.ready === true )
      .then(() => {
        // Loading screen
        document.getElementById("loading-screen").remove();

        view.map.add(LabelLayer);
         
        // Sublayers
        const EditLayer_1 = map.findLayerById("OD_parkovani_zabory_2008");
        
        // Widget
        // Tlačítko Home
        var homeWidget = new Home({
          view: view,
          label: "Výchozí zobrazení mapy"
        });

        // Widget
        // Lokalizace
        var locateWidget = new Locate({
          view,
          scale: 500,
          popupEnabled: false,
          label: "Najdi moji polohu",
        });
        let locateVM = new LocateVM({
          view,
          scale: 500,
          popupEnabled: false,
        });

        // Widget
        // O aplikaci
        var infoNode = document.createElement("div");
        infoNode.style.padding = "10px";
        infoNode.classList.add("esri-widget--panel", "esri-widget");
        infoNode.innerHTML = config.infoWidgetContent;

        var infoWidget = new Expand({
          content: infoNode, 
          view: view,
          expandTooltip: "O aplikaci",
          collapseTooltip: "Sbalit informace o aplikaci",
          group: "top-left",
          expandIcon: "question"
        });

        // Widget
        // Basemap Gallery
        var basemapWidget = new Expand({
            content: new BasemapGallery({
                view: view,
                source: new LocalBasemapsSource({
                    basemaps: [
                        BaseMapDefault,
                        BaseMap_1,
                        BaseMap_2   
                    ]
                })
            }),
            view: view,
            expandTooltip: "Podkladové mapy",
            collapseTooltip: "Sbalit podkladové mapy",
            group: "top-left"
        });

        // Widget
        // Search
        var searchWidget = new Search({ 
          view,
          includeDefaultSources: false,
          sources: [
            {
              layer: SearchLayerDefault,
              searchFields: ["adresa", "adresa_o"],
              displayField: "adresa",
              exactMatch: false,
              outFields: ["*"],
              name: "Adresní místa",
              placeholder: "Hledat adresu",
              maxResults: 6,
              maxSuggestions: 6,
              suggestionsEnabled: true,
              minSuggestCharacters: 3,
              popupEnabled: false,
              resultSymbol: {
                type: "simple-marker",
                size: "12px",  
                color: [0, 0, 0, 0],
                outline: {  
                  color: [217, 0, 18],
                  width: 2  
                }
              }
            }
          ]
        });

        // Widget 
        // Editor
        var editorWidget = new Editor({
          view: view,
          layerInfos: [{
            layer: EditLayer_1, // pass in the feature layer,
            formTemplate:  { // autocastable to FormTemplate
              elements: []
            },
            enabled: true, 
            addEnabled: true, 
            updateEnabled: true, 
            deleteEnabled: true,
            attributeUpdatesEnabled: true, 
            geometryUpdatesEnabled: true, 
            attachmentsOnCreateEnabled: true, 
            attachmentsOnUpdateEnabled: true 
          }]
        });

        // Editor - popisky
        editorWidget.on(["sketch-update", "sketch-create"], function(evt) {
          let evtDetail = evt.detail;

          if(
            (evtDetail.tool === "reshape" || evtDetail.tool === "polygon" || evtDetail.tool === "transform")) {
            LabelLayer.removeAll();

            // Přístup k vertexům kresleného polygonu
            let polygonVertexes = evt.detail.graphics ? evt.detail.graphics[0].geometry.rings[0] : evt.detail.graphic.geometry.rings[0];

            // Vytvoření linií z vertexů polygonu
            polygonVertexes.forEach((vertex, index) => {
              if (index + 1 < polygonVertexes.length) {
                let startVertex =  vertex;
                let endVertex =  polygonVertexes[index+1];

                // Vytvoření liniové geometrie z vertexu a pozice myši
                let geometry = new Polyline({
                  spatialReference: view.spatialReference,
                  paths: [[startVertex, endVertex]],
                }) 

                // Výpočet délky linie
                let length = Math.round(geometryEngine.planarLength(geometry, "meters"));

                // Vytvoření grafiky
                let segment = createGraphic(geometry, length, startVertex, endVertex);

                // Vložení nové grafiky do mapy
                view.map.reorder(LabelLayer, 9999);
                LabelLayer.add(segment);
              }
            })
          }
          if ( evtDetail.state === "complete" || evtDetail.state === "cancel") {
            LabelLayer.removeAll();
          }
        })

        // Vymazání grafiky po uložení editace
        EditLayer_1.on("edits", () => {
          LabelLayer.removeAll();
        })

        // Widgets positioning
        view.ui.add(locateWidget, "top-left", 0);
        view.ui.add(homeWidget, "top-left", 1);
        view.ui.add(basemapWidget, "top-left", 2);
        view.ui.add(infoWidget, "top-left", 3);
        view.ui.add(searchWidget, "top-right", 1);
        view.ui.add(editorWidget, "top-right", 1);

          
        // WATCHING EVENTS
        // Layers visibility
        reactiveUtils.watch(function() { return([map.basemap]) }, 
      
        ); 

        // Elements resizing and positioning
        reactiveUtils.watch(function() { return([view.width, view.height]) }, 
          ([width, height]) => {
            if (width < 545) {
              // About widget
              if (height < 1130) {
                infoNode.style.maxHeight = "none";
              }
            } 
            else {
              // About
              if (height <= 1130) {
                infoNode.style.maxHeight = (height - 350) + "px";
              }

              // Add problem button
            }
          }, 
          {
            initial: true
          }
        ); 

    });

    // FUNCTIONS ---
    // Vytvoření grafiky
    let createGraphic = (geometry, length, startVertex, endVertex) => {
      let segment =  new Graphic({
        geometry: geometry.extent.center,
        symbol: {
          type: "text", 
          color: "white",
          text: `\u{200B} \n${length} m`, // Odsazení od pomyslné linie neviditelným znakem
          font: {
            size: 20
            },
          haloColor: "black",
          haloSize: 1.5,
          horizontalAlignment: "center",
          verticalAlignment: "middle",
          angle: calculateAngle(startVertex, endVertex),
          }
      });
      return(segment)
    }

    // Výpočet úhlu popisku
    let calculateAngle = (startVertex, endVertex) => {
      let angle;
      angle = ((180/Math.PI)*Math.atan2(endVertex[0]-startVertex[0], endVertex[1]-startVertex[1]))
      if (angle < 0) {
        return(angle+360 + 90)
      }
      else {
        return(angle - 90)
      }
    }
});