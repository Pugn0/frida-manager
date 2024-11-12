

// During the runtime , few error may happen , its just because of the absense of the other root detection libraries. There's nothing to worry ;)




// Code for bypassing cyberkatze library

Java.perform(function(){

    var Root = Java.use("de.cyberkatze.iroot.IRoot");

    Root.isDeviceRooted.overload().implementation = function(){
        return false
    };
});

//code for bypassing Stericson library

Java.perform(function(){

    var Root = Java.use("com.stericson.RootShell.RootShell");

    Root.isRootAvailable.overload().implementation = function(){
        return false
    };
});


// Code for bypassing Jailmonkey library

Java.perform(function(){

    var Root = Java.use("com.gantix.JailMonkey.Rooted");

    Root.RootedCheck.overload().implementation = function(){
        return false
    };
});
Java.perform(() => {
    const klass = Java.use("com.gantix.JailMonkey.JailMonkeyModule");
    const hashmap_klass = Java.use("java.util.HashMap");
    const false_obj = Java.use("java.lang.Boolean").FALSE.value;

    klass.getConstants.implementation = function () {
        var h = hashmap_klass.$new();
        h.put("isJailBroken", false_obj);
        h.put("hookDetected", false_obj);
        h.put("canMockLocation", false_obj);
        h.put("isOnExternalStorage", false_obj);
        h.put("AdbEnabled", false_obj);
        return h;
    };
});

// Code for bypassing rootbeer library

Java.perform(function(){
    var RootBeer = Java.use("com.scottyab.rootbeer.RootBeer");
    var Utils = Java.use("com.scottyab.rootbeer.util.Utils");   
    
    RootBeer.detectRootManagementApps.overload().implementation = function(){
        return false;
    };
    
    RootBeer.detectPotentiallyDangerousApps.overload().implementation = function(){
        return false;
    };
    
    RootBeer.detectTestKeys.overload().implementation = function(){
        return false;
    };
    
    RootBeer.checkForBusyBoxBinary.overload().implementation = function(){
        return false;
    };
    
    RootBeer.checkForSuBinary.overload().implementation = function(){
        return false;
    };
    
    RootBeer.checkSuExists.overload().implementation = function(){
        return false;
    };
    
    RootBeer.checkForRWPaths.overload().implementation = function(){
        return false;
    };
    
    RootBeer.checkForDangerousProps.overload().implementation = function(){
        return false;
    };
    
    RootBeer.checkForRootNative.overload().implementation = function(){
        return false;
    };
    
    RootBeer.detectRootCloakingApps.overload().implementation = function(){
        return false;
    };
    
    Utils.isSelinuxFlagInEnabled.overload().implementation = function(){
        return false;
    };
    
    RootBeer.checkForMagiskBinary.overload().implementation = function(){
        return false;
    };
    
    RootBeer.isRooted.overload().implementation = function(){
        return false;
    };
});


