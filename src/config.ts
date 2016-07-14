
//http://lgorithms.blogspot.com/2013/07/angularui-router-as-infrastructure-of.html
//http://www.funnyant.com/angularjs-ui-router/

declare var configuration: any;
module SiGL {
    'use strinct';

    class config {
        static $inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider'];
        constructor(private $stateProvider: ng.ui.IStateProvider, private $urlRouterProvider: ng.ui.IUrlRouterProvider, private $locationProvider: ng.ILocationProvider) {
            this.$stateProvider
                .state("main", {
                url: '/',
                reloadOnSearch: true,
                //abstract: true,
                template:'<ui-view/>',
                views: {
                    'main': {
                        templateUrl: "Views/homeview.html",
                        controller: "SiGL.Controllers.MainController"
                    },
                    'sidebar': {
                        templateUrl: "Views/sidebarview.html",  
                        controller: "SiGL.Controllers.SidebarController"

                    },
                    'navbar': {
                        templateUrl: "Views/navigationview.html",
                        controller: "SiGL.Controllers.NavbarController"
                    }
                }
                })//end main state 
                          
            this.$urlRouterProvider.otherwise('/');

            //this.$locationProvider.html5Mode(true);                            
        }//end constructor
    }//end class

    angular.module('SiGL',[
        "ui.router", "mobile-angular-ui",
        'leaflet-directive',
        "SiGL.Services",
        "SiGL.Controllers",
        'jsonFormatter', 'WiM.Services', 'WiM.Event', 'SiGL.Directives'
        ])
        .config(config);
}//end module 