//------------------------------------------------------------------------------
//----- MainController ------------------------------------------------------
//------------------------------------------------------------------------------

//-------1---------2---------3---------4---------5---------6---------7---------8
//       01234567890123456789012345678901234567890123456789012345678901234567890
//-------+---------+---------+---------+---------+---------+---------+---------+

// copyright:   2014 WiM - USGS

//    authors:  Jeremy K. Newson USGS Wisconsin Internet Mapping


//   purpose:  

//discussion:   Controllers are typically built to reflect a View. 
//              and should only contailn business logic needed for a single view. For example, if a View 
//              contains a ListBox of objects, a Selected object, and a Save button, the Controller 
//              will have an ObservableCollection ObectList, 
//              Model SelectedObject, and SaveCommand.

//Comments
//04.14.2015 jkn - Created

//Imports"
module SiGL.Controllers {
    'use strinct';
    interface IMainControllerScope extends ng.IScope {
        vm: MainController;
    }
    interface IMainController {
       
    }
    interface ILeafletData {
        getMap(): ng.IPromise<any>;
    }
    interface ICenter {
        lat: number;
        lng: number;
        zoom: number;
    }
    interface IBounds {
        southWest: IMapPoint;
        northEast: IMapPoint;
    }
    interface IMapPoint {
        lat: number;
        lng: number;
    }
    interface IMapLayers {
        baselayers: Object;
        overlays: ILayer;
        markers: Object;
        geojson: Object;
    }
    interface ILayer {
        name: string;
        url: string;
        type: string;
        visible: boolean;
        layerOptions: Object;
    }
    class Center implements ICenter {
        //Properties
        //-+-+-+-+-+-+-+-+-+-+-+-
        public lat: number;
        public lng: number;
        public zoom: number;
        //Constructor
        //-+-+-+-+-+-+-+-+-+-+-+-
        constructor(lt: number, lg: number, zm: number) {
            this.lat = lt;
            this.lng = lg;
            this.zoom = zm;
        }
    }   
    class Layer implements ILayer {
        public name: string;
        public url: string;
        public type: string;
        public visible: boolean;
        public layerOptions: Object;

        public constructor(nm: string, ul: string, ty: string, vis: boolean, op: Object = undefined) {
            this.name = nm;
            this.url = ul;
            this.type = ty;
            this.visible = vis;
            this.layerOptions = op;

        }
    }

   
    class MainController implements IMainController {
        //Events
        //-+-+-+-+-+-+-+-+-+-+-+-
        private _onSelectedUriHandler: WiM.Event.EventHandler<WiM.Event.EventArgs>;
        private _onSelectedResourceHandler: WiM.Event.EventHandler<WiM.Event.EventArgs>;

        //Properties
        //-+-+-+-+-+-+-+-+-+-+-+-
        public sideBarCollapsed: boolean;
        public downloadable: boolean;
        public selectedUri: Models.IURI;
        public selectedResource: Models.IResource;
        //public selectedUriParameters: Array<Models.IURIParameter>;
        public selectedMedia: string;
        public requestResults: string;
        public waitCursor: boolean;
        public onMapWaitCursor: boolean;
        public showOnMap: boolean;
        public applicationURL: string;
        public servicesBaseURL: string;

        public mapPoint: IMapPoint = null;
        public bounds: IBounds = null;
        private leafletData: ILeafletData;
        public cursorStyle: string;
        public center: ICenter = null;
        public layers: IMapLayers = null;
        public markers: Object = null;
        public geojson: Object = null;
        public fitBounds: IBounds;
        public mapPoints: Array<any>;
        public mapSpinner;

        //Constructor
        //-+-+-+-+-+-+-+-+-+-+-+-
        static $inject = ['$scope', '$filter', 'SiGL.Services.ResourceService', 'leafletBoundsHelpers', 'leafletData'];
        constructor($scope: IMainControllerScope, private $filter, private Resource: Services.IResourceService, leafletBoundsHelper: any, leafletData: ILeafletData) {
            $scope.vm = this;         
            this.selectedUri = new SiGL.Models.URI('');
            this.waitCursor = false;
            this.onMapWaitCursor = false;
            this.sideBarCollapsed = false;
            this.downloadable = false;
            this.applicationURL = configuration.baseurls['application'];
            this.servicesBaseURL = configuration.baseurls['services'];

            this._onSelectedResourceHandler = new WiM.Event.EventHandler<WiM.Event.EventArgs>(() => {
                //clear selectedUri on resource change
                this.selectedUri = new SiGL.Models.URI('');
                this.selectedResource = Resource.SelectedResource;
            });
            Resource.onResourceChanged.subscribe(this._onSelectedResourceHandler);

            this._onSelectedUriHandler = new WiM.Event.EventHandler<WiM.Event.EventArgs>(() => {
                this.selectedUri = Resource.SelectedUri;
                this.requestResults = ""
            });
            Resource.onUriChanged.subscribe(this._onSelectedUriHandler);             
            
            //MAP STUFF
            //-+-+-+-+-+-+-+-+-+-+-+-
            this.initMap();
            this.leafletData = leafletData;
            this.showOnMap = false;
            
            $scope.$on('leafletDirectiveMap.zoomend',(event, args) => {
                //console.log('map zoom changed', args.leafletEvent.target._animateToZoom, 15, this.cursorStyle);
                (args.leafletEvent.target._animateToZoom > 13) ? this.cursorStyle = 'crosshair' : this.cursorStyle = 'hand'
            });

            $scope.$watch(() => this.selectedUri.selectedMedia,(newVal, oldVal) => {
                this.makeRequestURL();
            });

            $scope.$watch(() => this.selectedUri.parameters,(newVal, oldVal) => {

                this.makeRequestURL();

                if (this.selectedUri.id == 'Delineate Watershed By Location') {

                    for (var key in this.selectedUri.parameters) {

                        //if oldval doesnt exists were on first page load
                        if (this.selectedUri.parameters[key].name == "rcode") {
                                                       
                        }
                    }
                }
            }, true);

        }

        //Methods
        //-+-+-+-+-+-+-+-+-+-+-+-
        public loadResponse() {

            this.waitCursor = true;
            this.showOnMap = false;
            this.requestResults = '';

            this.Resource.getURL(this.selectedUri.newURL, this.selectedMedia)
                .then(
                (response: any) => {
                    this.requestResults = response.data;
                },(error) => {
                    this.requestResults = "(" + error.status + ") " + error.data;
                }).finally(() => {
                this.waitCursor = false;
                this.showOnMap = true;
            });
        }

        public makeRequestURL() {
            //clear map if there's a response in there
            this.geojson = {};

            this.downloadable = false;
            var inputParams = [this.selectedUri.selectedMedia];
            for (var i = 0; i < this.selectedUri.parameters.length; i++) {
                inputParams.push(this.selectedUri.parameters[i].value);
            }
            var func = this.selectedUri.uri.format;
            var newURL = func.apply(this.selectedUri.uri, inputParams);
            this.selectedUri.newURL = newURL;            

            //for file download endpoints, don't show button to load response in output box
            if (this.selectedUri.availableMedia != undefined) {
                if (this.selectedUri.availableMedia.length == 0)
                    this.downloadable = true;
            }
            return newURL.replace(/\{(.+?)\}/g, "");

        }


        //MAP STUFF
        //-+-+-+-+-+-+-+-+-+-+-+-
        private changeMapRegion(region: string) {
            this.leafletData.getMap().then((map: any) => {
                //console.log('getting the map for fitbounds');
                for (var index in configuration.regions) {
                    var value = configuration.regions[index];
                    if (value.RegionID == region.toUpperCase()) {
                        //console.log('match found', value.RegionID + "_region", value.Bounds);
                        map.fitBounds(value.Bounds);
                    }
                }
            });
        }

        private showResponseOnMap() {  
            this.onMapWaitCursor = true;                                       
            //clear out this.markers
            this.markers = {};
            this.geojson = {};            
            this.geojson["data"] = this.requestResults;
            //get the bounds of all points
            var mp = [];
            this.geojson["data"]["features"].forEach((g) => {                
                mp.push([g.geometry.coordinates[1], g.geometry.coordinates[0]]);                
            })                        
           
            this.leafletData.getMap()
                .then(
                (map: any) => {
                    map.fitBounds(mp);                
            }).finally(() => {
                this.onMapWaitCursor = false;                
            });

           
            if (this.selectedUri.id.indexOf("Site") >= 0 && this.selectedUri.id.indexOf("Full") < 0) {
                //site query
                this.geojson["onEachFeature"] = function (obj, layer) {
                    var popupContent = '';
                    angular.forEach(obj.properties, function (value, key) {
                        if (key == 'site_id' || key == 'project_id' || key == 'name' || key == 'latitude' || key == 'longitude' || key == 'state_province') {
                            popupContent += '<strong>' + key + ': </strong>' + value + '</br>';
                        }
                    });
                    layer.bindPopup(popupContent);
                }
            }
            if (this.selectedUri.id.indexOf("Full") >= 0) {
                this.geojson["onEachFeature"] = function (obj, layer) {
                    var popupContent = '';
                    angular.forEach(obj.properties, function (value, key) {
                        if (key == 'SiteId' || key == 'Name' || key == 'latitude' || key == 'longitude' || key == 'State') {
                            popupContent += '<strong>' + key + ': </strong>' + value + '</br>';
                        }
                    });
                    layer.bindPopup(popupContent);
                }
            }
            
        }
        private initMap(): void {
            this.center = new Center(39, -100, 4);
            this.layers = {
                baselayers: configuration.basemaps,
                overlays: configuration.overlayedLayers,
                markers: this.markers,
                geojson: this.geojson
            }
            this.markers = {};
            this.geojson = {};
            L.Icon.Default.imagePath = 'images';
        } 
       
        //Helper Methods
        //-+-+-+-+-+-+-+-+-+-+-+-
        private sm(msg: string) {
            try {
                //toastr.options = {
                //    positionClass: "toast-bottom-right"
                //};

                //this.NotificationList.unshift(new LogEntry(msg.msg, msg.type));

                //setTimeout(() => {
                //    toastr[msg.type](msg.msg);
                //    if (msg.ShowWaitCursor != undefined)
                //        this.IsLoading(msg.ShowWaitCursor)
                //}, 0)
            }
            catch (e) {
            }
        }
    }//end class

    angular.module('SiGL.Controllers')
        .controller('SiGL.Controllers.MainController', MainController)
}//end module