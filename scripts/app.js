// --- URL parametry ---
var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);
var urlCislo = urlParams.get('cislo');

// ARCGIS JS API MODULS ---
require([
    "esri/WebMap",
    "esri/views/MapView",
    "esri/widgets/Popup",
    "esri/core/reactiveUtils",
    "esri/widgets/Expand",
    "esri/widgets/Home",
    "esri/widgets/Locate",
    "esri/widgets/BasemapGallery/support/LocalBasemapsSource",
    "esri/Basemap",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Search",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/widgets/Editor",
    "esri/geometry/Polyline",
    "esri/geometry/geometryEngine",
    "esri/form/ExpressionInfo",
    "esri/request",
    "esri/identity/IdentityManager"
   ], function(WebMap, MapView, Popup, reactiveUtils, Expand, Home, Locate, LocalBasemapsSource, Basemap, BasemapGallery, Search, FeatureLayer, GraphicsLayer, Graphic, Editor, Polyline, geometryEngine, ExpressionInfo, esriRequest, esriId) {

    // TOKEN
    let var1 = config.variable1;
    let var2 = config.variable2;
    let formData = new FormData();
    formData.append("username", var1);
    formData.append("password", var2);
    formData.append("client", "requestip");
    formData.append("expiration", 120);
    formData.append("f", "json");
    let generateToken;
    if (var1 && var2) {
      generateToken = "generateToken"
    }
    else {
      generateToken = ""
    }

    esriRequest(`${config.portalUrl}/sharing/rest/${generateToken}`, {
      method: "post",
      body: formData
    }).then((response) => {

      let geoJson = response.data.token ? response.data.token : "";
      let expires = response.data.token ? response.data.expires : "";
      let ssl = response.data.ssl ? response.data.ssl : "";

      esriId.registerToken({
        "expires": expires,
        "server": `${config.portalUrl}/sharing/rest/${generateToken}`,
        "ssl": ssl,
        "token": geoJson
      })

      // APP lAYOUT ---
      // Header bar
      document.querySelector(".title-container").innerHTML = config.headerTitle;
      document.querySelector(".logo-container").innerHTML = 
        `<a href="${config.headerLink}" target="_blank">
          <img class="logo-image" src="images/header-logo-jihlava.svg" alt="logo">
        </a>`;

      // WEBMAP ---
      // Basemaps
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
      // Ortofoto
      const BaseMap_3 = new Basemap({
        portalItem: {
          id: "3b9f68473c714c888769cb04f72f15f6",
          portal: {
            url: "https://gis.jihlava-city.cz/portal"
          },
        },
        title: "Letecká mapa",
        thumbnailUrl: "images/bm-letecka-aktual.png"
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
      const LabelLayer = new GraphicsLayer({
        title: "Vrstva délek (editace)",
        listMode: "hide",
      })

      // MAIN CODE
      // After view is loaded    
      reactiveUtils.once( () => view.ready === true )
        .then(() => {
          // Loading screen
          document.getElementById("loading-screen").remove();

          // Add graphic layer for edit sketch labeling 
          view.map.add(LabelLayer);
          
          // Sublayers
          let EditLayer_1 = map.findLayerById(config.editLayerId);

          // Init snapping layers
          let initSnappingLayers = []
          config.snappLayersOnStart.forEach((layerId) => {
            const layer = map.findLayerById(layerId);
            if (layer) {
              initSnappingLayers.push(layer)
            }
          })
         
          // Doplnění cisla z query parametru
          EditLayer_1.outFields = ["*"];
          if (urlCislo) {
            EditLayer_1.on("edits", (evt) => {
              if (evt.edits.addFeatures.length > 0) {
                let addFeatures = evt.edits.addFeatures;
                addFeatures[0].attributes.cislo = urlCislo;
                addFeatures[0].attributes.objectid = evt.addedFeatures[0].objectId;
                EditLayer_1.applyEdits({
                  updateFeatures: addFeatures
                })
              }
            })
          }
          
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
                  activeBasemap: BaseMap_2,  
                  source: new LocalBasemapsSource({
                      basemaps: [
                          BaseMap_3,
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
                maxResults: 20,
                maxSuggestions: 20,
                suggestionsEnabled: true,
                minSuggestCharacters: 3,
                popupEnabled: false,
                resultSymbol: {
                  type: "simple-marker",
                  size: "12px",  
                  color: [0, 0, 0, 0],
                  outline: {  
                    color: "#F7F700",
                    width: 2  
                  }
                }
              }
            ]
          });

          // Widget 
          // Editor
          const hideFields = new ExpressionInfo({
            name: "alwaysHidden",
            expression: "false"
          });
          var editorWidget = new Editor({
            view: view,
            visibleElements: {
              tooltipsToggle: false,
              snappingControlsElements: {
                layerList: true // Toto po otestování zakázat
              }
            },
            snappingOptions: { 
              enabled: true,
              featureSources: [
                {
                  layer: LabelLayer,
                  enabled: false
                },
                ...initSnappingLayers.map((layer) => {
                  return{layer, enabled: true }
                })
              ] 
            },
            layerInfos: [{
              layer: EditLayer_1, 
              enabled: true, 
              addEnabled: true, 
              updateEnabled: true, 
              deleteEnabled: true,
              attributeUpdatesEnabled: true, 
              geometryUpdatesEnabled: true, 
              attachmentsOnCreateEnabled: true, 
              attachmentsOnUpdateEnabled: true,
              formTemplate: {
                elements: [{
                    type: "field",
                    fieldName: "cislo",
                    label: "Číslo",
                    visibilityExpression: "alwaysHidden"
                  }]
              }
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
          view.ui.add(editorWidget, "bottom-right", 1);
            
          // WATCHING EVENTS
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
              }
            }, 
            {
              initial: true
            }
          ); 
      });
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
            size: 10
            },
          haloColor: "black",
          haloSize: 1,
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