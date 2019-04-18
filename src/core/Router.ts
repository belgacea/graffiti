export default class Router {
        private static uniloc = require('uniloc');
        private static Routes:any;
        
        public static init() {
                this.Routes = this.uniloc({ 
                          Home: 'GET /',
                          VideoDetails: 'GET /video-details/:videoId',
                          Settings: 'GET /settings',
                          PersonDetails: 'GET /person-details/:personId',
                          SearchResults: 'GET /search-results',
                          Duplicates: 'GET /duplicates',
                          CleanUp: 'GET /clean-up',
                          Test: 'GET /test'
                        });
        }

        public static parse(route:string):{name:string, options:any} {
                return this.Routes.lookup(route.replace('#/', ''));
        }

        public static to = {
                VideoDetails: (videoId) => {
                        window.location.hash = '#/video-details/' + videoId;
                },
                PersonDetails: (personId) => {
                        window.location.hash = '#/person-details/' + personId;
                },
                Settings: () => {
                        window.location.hash = '#/settings';
                },
                Home: () => {
                        window.location.hash = '#/';
                },
                SearchResults: () => {
                        window.location.hash = '#/search-results';
                },
                Duplicates: () => {
                        window.location.hash = '#/duplicates';
                },
                CleanUp: () => {
                        window.location.hash = '#/clean-up';
                }
        }

        public static is = {
                Home: () => {
                        return window.location.hash === '#/';
                },
                VideoDetails: () => {
                        return window.location.hash.indexOf('#/video-details/') === 0;
                },
                PersonDetails: () => {
                        return window.location.hash.indexOf('#/person-details/') === 0;
                },
                SearchResult: () => {
                        return window.location.hash.indexOf('#/search-results') === 0;
                }
        }

        // public static generate(route:string, options:any) {
        //         return this.Routes.generate(route, options);
        // }
}