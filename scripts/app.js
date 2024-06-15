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

    // Label layer and model
    let LabelLayerLines = [];
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
            updateEnabled: false, 
            deleteEnabled: false,
            attributeUpdatesEnabled: true, 
            geometryUpdatesEnabled: true, 
            attachmentsOnCreateEnabled: true, 
            attachmentsOnUpdateEnabled: true 
          }]
        });

        // Editor - popisky
        let startVertex = null;
        let endVertex = null;
        let countVertexSegment = 0;
        editorWidget.on("sketch-create", function(evt) {
          const { toolEventInfo } = evt.detail;
          
          // Po vložení nového vertexu
          if (toolEventInfo?.type === "vertex-add") {
            startVertex =  toolEventInfo.added[0];
            countVertexSegment += 1;
          }

          // Při pohybu myší
          if (toolEventInfo?.type === "cursor-update") {
            endVertex =  toolEventInfo.coordinates
          }
        
          // Vytvoření linie mezi vertexem a pozicí myši
          if (countVertexSegment === 1 && endVertex) {
            
            // Odebrání poslední pozice z pole
            LabelLayerLines.pop();

            // Vytvoření liniové geometrie z vertexu a pozice myši
            let geometry = new Polyline({
              spatialReference: view.spatialReference,
              paths: [[startVertex, endVertex]],
              
            }) 

            // Výpočet délky linie
            let length = Math.round(geometryEngine.planarLength(geometry, "meters"));

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
console.log(calculateAngle(startVertex, endVertex));
            // Vytvoření grafiky
            let segment =  new Graphic({
              geometry: geometry.extent.center,
              symbol: {
                type: "text", 
                color: "white",
                text: `\u{200B} \n${length} m`,
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

            // Přidání grafiky do pole
            LabelLayerLines.push(segment);
      
            // Přidání pole do grafické vrstvy
            LabelLayer.removeAll();
            LabelLayer.addMany(LabelLayerLines);
          }
        });

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
    // HTML
    // Problem window
    // Show window for adding problem point to map
    let showAddProblemToMapWindow = () => {
      addProblemContainer.prepend(problemWindowContainer);
      addProblemBtn.style.display = "none";

      sketchingState = true;
    }

    // Close window for adding problem point to map
    let closeAddProblemToMapWindow = () => {
      problemWindowContainer.remove(); // Remove window for adding point
      addProblemBtn.style.display = "flex"; // Enable create button
      resetSketchViewModel();
      
      sketchingState = false;
    }

    let changeMessageInProblemToMapWindow = (message, actionBar) => {
      problemWindowBody.innerHTML = message;
      problemWindowBody.append(actionBar);
    }

    // Problems form
    // Show problems form
    let showProblemFormContainer = () => {
      overlayEl.classList.add("opened");
    }
    let closeProblemFormContainer = () => {
      problemFormContainer.scrollTo(0,0);
      overlayEl.classList.remove("opened");
    }

    // Category
    let selectCategory = (categoryCardEl, category) => {
      setValidationMessage(problemFormCategory, "valid", "check", `Zvolen typ závady: ${category.name}`)
      categoryCardEl.setAttribute("selected", "");
    }

    let resetAllCardSelection = () => {
      problemFormCategory.querySelectorAll("calcite-card").forEach((card) => {
        card.removeAttribute("selected");
      })
    }

    // Attachment
    // Remove attachement
    const removeAttachment = () => {
      setValidationMessage(problemFormAttachment, "invalid", "exclamation-mark-triangle", messageInitialFormAttachment)
      removeAttachmentBtn.style.display = "none";
      attachmentFormEl.reset();
    }

    // DOM after image loaded
    const afterAttachmentLoaded = (imageFile) => {
      removeAttachmentBtn.style.display = "inline-block";
      addInfoAboutImageToInput(imageFile);
    }

    // DOM after bad file loaded
    const afterBadFileLoaded = () => {
      setValidationMessage(problemFormAttachment, "invalid", "exclamation-mark-triangle", "Nepodporovaný soubor!")
      removeAttachmentBtn.style.display = "none";
    }

    // Info about added image
    const addInfoAboutImageToInput = (imageFile) => {
      setValidationMessage(problemFormAttachment, "valid", "check", `${imageFile.name} (${formatFileSize(imageFile.size)})`)
    }

    // Validation message
    let setValidationMessage = (el, status, icon, text) => {
      let messageEl = el.querySelector("calcite-input-message");
      messageEl.innerText = text;
      messageEl.status = status;
      messageEl.icon = icon;
    }

    // Loading over form
    let addLoadingScreenOverForm = () => {
      problemLoading.style.display = "block";
    }
    let removeLoadingScreenOverForm = () => {
      problemLoading.style.display = "none";
    }

    // Result screen over form
    let addResultScreenOverForm = (type) => {
      problemResultScreen.style.display = "block";
      if ( type === "success" ) {
        problemResultScreen.innerHTML = problemSendedSuccess;
      }
      if ( type === "error" ) {
        problemResultScreen.innerHTML = problemSendedError;
      }
    }
    let removeResultScreenOverForm = () => {
      problemResultScreen.style.display = "none";
      problemResultScreen.innerHTML = null;
    }

    // Reset form inputs
    let resetForm = () => {
      resetAllCardSelection();
      document.querySelectorAll(".problem-input").forEach((input) => {
        input.value = null;
      });

      attachmentFormEl.reset();
      removeAttachment();	

      setValidationMessage(problemFormCategory, "invalid", "information", messageInitialFormCategory)
      setValidationMessage(problemFormDescription, "invalid", "information", messageInitialFormDescription);
      setValidationMessage(problemFormEmail, "invalid", "information", messageInitialFormEmail);
      setValidationMessage(problemFormAttachment, "invalid", "information", messageInitialFormAttachment);
    }
    
    // BUSINESS - MAIN
    // Geometry
    // Reset sketch view model
    let resetSketchViewModel = () => {
      changeMessageInProblemToMapWindow(messageSelectPlace, problemWindowLocateBtn); 
      sketchLayer.graphics.removeAll(); // Remove graphic from map
      sketchViewModel.cancel();
      setState("geometry", null);
    }

    // Active sketching point problem in map
    let activateSketchingToMap = () => {
      // Create model
      sketchViewModel = new SketchViewModel(sketchViewModelOptions);
      // Initialize sketching
      sketchViewModel.create("point");
      // Move locate graphic under závada graphic
      moveLocateGraphicUnderSketch()
      // Events
      sketchViewModel.on("create", function(e) {
        sketchLayer.graphics.removeAll();
        if(e.state === "complete") {
          sketchLayer.graphics.add(e.graphic);
          changeMessageInProblemToMapWindow(messageSelectPlaceSuccess, problemActionBar); 

          setState("geometry", e.graphic);
          //activateSketchingToMap(); OPTION: just click for geometry update
        }
      });
      sketchViewModel.on("update", function(e) {
        setState("geometry", e.graphics[0]);
      });
    }

    // Geometry from location
    let placeSketchToMapDirectly = (e) => {
      sketchViewModel.cancel();
      // Create map graphic
      let graphic = new Graphic({
        geometry: {
          type: "point",
          longitude: e.coords.longitude, 
          latitude: e.coords.latitude
        },
        symbol: sketchSymbol
      });
      sketchLayer.graphics.add(graphic);
      changeMessageInProblemToMapWindow(messageSelectPlaceSuccess, problemActionBar); 
      
      setState("geometry", graphic);
    }

    // Validate send form button
    let validateSendButton = () => {
      let valid = false;
      for (let prop in formState) {
        if (formState[prop] === null) {
            valid = false;
            break;
        }
        else {
          valid = true;
        }
      }
      valid ? problemSendBtn.removeAttribute("disabled") : problemSendBtn.setAttribute("disabled", "");
    }

    // Create feature for send 
    let createFeatureForSend = () => {
      let feature = formState.geometry;
      feature.setAttribute("typ", formState.category);
      feature.setAttribute("email", formState.email);
      feature.setAttribute("poznamka", formState.description);
      return(feature)
    }

    let resetApp = () => {
      resetState();
      resetForm();
      closeAddProblemToMapWindow();
      addEmailFromLocalStorage();  
    }

    // Set state
    let setState = (type, value) => {
      formState[type] = value;
      validateSendButton();
      console.log(`State update - ${type}: `, formState);
    }

    let resetState = () => {
      for(let props in formState) {
        formState[props] = null
      }
      console.log(`State reset: `, formState);
    }

    let addEmailFromLocalStorage = () => {
      if (localStorage.getItem("hlaseni_zavad_email")) {
        let localSotarageEmail = localStorage.getItem("hlaseni_zavad_email");
        problemFormEmail.querySelector("calcite-input").value = localSotarageEmail;
        setValidationMessage(problemFormEmail, "valid", "check", "e-mail vložen.");
        setState("email", localSotarageEmail)
      };
    }

    // Refresh layer with added feature
    let refreshMapLayer = (layer) => {
      layer.refresh();
    }

    // BUSINESS - OTHER
    // Move locate graphic under závada graphic
    let moveLocateGraphicUnderSketch = () => {
      if (view.graphics) {
        view.graphics.forEach(graphic => {
          if (graphic.attributes) {
            if ('altitudeAccuracy' in graphic.attributes) {
              view.graphics.removeAll(); 
              locateLayer.add(graphic);
            }
          }
        });
      }
    }

    // Email validation
    let validateEmail = (email) => {
      return String(email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    };

    // Format file size
    let formatFileSize = (size) => {
      if (size < 1000000){
        return(Math.floor(size/1000) + ' kB');
      }
      else {
        return(Math.floor(size/1000000) + ' MB');  
      }
    } 

    // Resize attachment
    // Process attachment file
    let processAttachmentFile = async (file) => {
      
      if( !( /image/i ).test( file.type ) ) {
          return false;
      }

      // Read the files
      let reader = new FileReader();
      reader.readAsArrayBuffer(file);

      let newform = document.createElement("form");
      let newinput = document.createElement("input");
      
      reader.onload = function (event) {

        // Blob stuff
        let blob = new Blob([event.target.result]); // create blob...
        window.URL = window.URL || window.webkitURL;
        let blobURL = window.URL.createObjectURL(blob); // and get it's URL
        
        // Helper Image object
        let image = new Image();
        image.src = blobURL;

        image.onload = function() {
          // Have to wait till it's loaded
          // Send it to canvas
          let resized = resizeImage(image); 

          // Convert the canvas content to a Blob
          resized.toBlob((blob) => {

            // Create a new File from the Blob
            let resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
            let container = new DataTransfer();
            container.items.add(resizedFile);
                    
            // Create new virtual form
            newinput.setAttribute("type", "file"); 
            newinput.setAttribute("name", "attachment"); 
            newinput.setAttribute("accept", "image/*");
            newinput.files = container.files;
            newform.append(newinput);

            afterAttachmentLoaded(resizedFile);

            // Attachment data for custom esriRequest
            // It can be removed after solving standard applyEdits() method
            var attachmentData = new FileReader();
            attachmentData.onload = function(event) {
                let attachmentDataContent = event.target.result.replace(/^data:image\/[a-z]+;base64,/, "");
                setState("attachmentData", attachmentDataContent);
            };
            attachmentData.readAsDataURL(newinput.files[0]);

            // Set virtual form to state
            setState("attachment", newinput.files[0]);
            
          }, 'image/jpeg', config.attachments.quality); 
        }
      }
    }

    // Resize attachment file
    let resizeImage = (img) => {

      let max_width = config.attachments.maxWidth;
      let max_height = config.attachments.maxHeight;

      let canvas = document.createElement('canvas');

      let width = img.width;
      let height = img.height;

      // Calculate the width and height, constraining the proportions
      if (width > height) {
        if (width > max_width) {

          height = Math.round(height *= max_width / width);
          width = max_width;

        }
      } 
      else {
        if (height > max_height) {

          width = Math.round(width *= max_height / height);
          height = max_height;

        }
      }

      // Resize the canvas and draw the image data into it
      canvas.width = width;
      canvas.height = height;
      let ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      return canvas;
    }
});