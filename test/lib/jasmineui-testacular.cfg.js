jasmineuiConfig = {
    loadMode:'popup',
    closeTestWindow:false,
    instrumentUrlPatterns: ['.*'],
    scripts:[
        {position:'begin', url:'/test/ui/inject/sampleBeginScript.js'},
        {position:'end', url:'/test/ui/inject/sampleEndScript.js'}
    ]
};