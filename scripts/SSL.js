setTimeout(function(){
    Java.perform(function (){
    	console.log("");
	    console.log("[.] Cert Pinning Bypass/Re-Pinning");
	    var CertificateFactory = Java.use("java.security.cert.CertificateFactory");
	    var FileInputStream = Java.use("java.io.FileInputStream");
	    var BufferedInputStream = Java.use("java.io.BufferedInputStream");
	    var X509Certificate = Java.use("java.security.cert.X509Certificate");
	    var KeyStore = Java.use("java.security.KeyStore");
	    var TrustManagerFactory = Java.use("javax.net.ssl.TrustManagerFactory");
	    var SSLContext = Java.use("javax.net.ssl.SSLContext");
	    console.log("[+] Loading our CA...")
	    var cf = CertificateFactory.getInstance("X.509");
	    try {
	    	var fileInputStream = FileInputStream.$new("/data/local/tmp/cert-der.crt");
	    }
	    catch(err) {
	    	console.log("[o] " + err);
	    }
	    var bufferedInputStream = BufferedInputStream.$new(fileInputStream);
	  	var ca = cf.generateCertificate(bufferedInputStream);
	    bufferedInputStream.close();
		var certInfo = Java.cast(ca, X509Certificate);
	    console.log("[o] Our CA Info: " + certInfo.getSubjectDN());
	    console.log("[+] Creating a KeyStore for our CA...");
	    var keyStoreType = KeyStore.getDefaultType();
	    var keyStore = KeyStore.getInstance(keyStoreType);
	    keyStore.load(null, null);
	    keyStore.setCertificateEntry("ca", ca);
		console.log("[+] Creating a TrustManager that trusts the CA in our KeyStore...");
	    var tmfAlgorithm = TrustManagerFactory.getDefaultAlgorithm();
	    var tmf = TrustManagerFactory.getInstance(tmfAlgorithm);
	    tmf.init(keyStore);
	    console.log("[+] Our TrustManager is ready...");
	    console.log("[+] Hijacking SSLContext methods now...")
	    console.log("[-] Waiting for the app to invoke SSLContext.init()...")
	   	SSLContext.init.overload("[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom").implementation = function(a,b,c) {
	   		console.log("[o] App invoked javax.net.ssl.SSLContext.init...");
	   		SSLContext.init.overload("[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom").call(this, a, tmf.getTrustManagers(), c);
	   		console.log("[+] SSLContext initialized with our custom TrustManager!");
	   	}
    });
},0);
Java.perform(function() {
    var array_list = Java.use("java.util.ArrayList");
    var ApiClient = Java.use('com.android.org.conscrypt.TrustManagerImpl');

    ApiClient.checkTrustedRecursive.implementation = function(a1, a2, a3, a4, a5, a6) {
        var k = array_list.$new();
        return k;
    }

}, 0);

setTimeout(function () {
    Java.perform(function () {
        console.log("---");
        console.log("Unpinning Android app...");
        try {
            const UnverifiedCertError = Java.use('javax.net.ssl.SSLPeerUnverifiedException');
            UnverifiedCertError.$init.implementation = function (str) {
                console.log('  --> Unexpected SSL verification failure, adding dynamic patch...');

                try {
                    const stackTrace = Java.use('java.lang.Thread').currentThread().getStackTrace();
                    const exceptionStackIndex = stackTrace.findIndex(stack =>
                        stack.getClassName() === "javax.net.ssl.SSLPeerUnverifiedException"
                    );
                    const callingFunctionStack = stackTrace[exceptionStackIndex + 1];

                    const className = callingFunctionStack.getClassName();
                    const methodName = callingFunctionStack.getMethodName();

                    console.log(`      Thrown by ${className}->${methodName}`);

                    const callingClass = Java.use(className);
                    const callingMethod = callingClass[methodName];

                    if (callingMethod.implementation) return; // Already patched by Frida - skip it

                    console.log('      Attempting to patch automatically...');
                    const returnTypeName = callingMethod.returnType.type;

                    callingMethod.implementation = function () {
                        console.log(`  --> Bypassing ${className}->${methodName} (automatic exception patch)`);
                        if (returnTypeName === 'void') {
                            return;
                        } else {
                            return null;
                        }
                    };

                    console.log(`      [+] ${className}->${methodName} (automatic exception patch)`);
                } catch (e) {
                    console.log('      [ ] Failed to automatically patch failure');
                }

                return this.$init(str);
            };
            console.log('[+] SSLPeerUnverifiedException auto-patcher');
        } catch (err) {
            console.log('[ ] SSLPeerUnverifiedException auto-patcher');
        }
        try {
            const HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
            HttpsURLConnection.setDefaultHostnameVerifier.implementation = function (hostnameVerifier) {
                console.log('  --> Bypassing HttpsURLConnection (setDefaultHostnameVerifier)');
                return; 
            };
            console.log('[+] HttpsURLConnection (setDefaultHostnameVerifier)');
        } catch (err) {
            console.log('[ ] HttpsURLConnection (setDefaultHostnameVerifier)');
        }
        try {
            const HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
            HttpsURLConnection.setSSLSocketFactory.implementation = function (SSLSocketFactory) {
                console.log('  --> Bypassing HttpsURLConnection (setSSLSocketFactory)');
                return; 
            };
            console.log('[+] HttpsURLConnection (setSSLSocketFactory)');
        } catch (err) {
            console.log('[ ] HttpsURLConnection (setSSLSocketFactory)');
        }
        try {
            const HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
            HttpsURLConnection.setHostnameVerifier.implementation = function (hostnameVerifier) {
                console.log('  --> Bypassing HttpsURLConnection (setHostnameVerifier)');
                return; 
            };
            console.log('[+] HttpsURLConnection (setHostnameVerifier)');
        } catch (err) {
            console.log('[ ] HttpsURLConnection (setHostnameVerifier)');
        }

        // SSLContext
        try {
            const X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
            const SSLContext = Java.use('javax.net.ssl.SSLContext');

            const TrustManager = Java.registerClass({
                // Implement a custom TrustManager
                name: 'dev.asd.test.TrustManager',
                implements: [X509TrustManager],
                methods: {
                    checkClientTrusted: function (chain, authType) { },
                    checkServerTrusted: function (chain, authType) { },
                    getAcceptedIssuers: function () { return []; }
                }
            });

            // Prepare the TrustManager array to pass to SSLContext.init()
            const TrustManagers = [TrustManager.$new()];

            // Get a handle on the init() on the SSLContext class
            const SSLContext_init = SSLContext.init.overload(
                '[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom'
            );

            // Override the init method, specifying the custom TrustManager
            SSLContext_init.implementation = function (keyManager, trustManager, secureRandom) {
                console.log('  --> Bypassing Trustmanager (Android < 7) request');
                SSLContext_init.call(this, keyManager, TrustManagers, secureRandom);
            };
            console.log('[+] SSLContext');
        } catch (err) {
            console.log('[ ] SSLContext');
        }

        // TrustManagerImpl (Android > 7)
        try {
            const array_list = Java.use("java.util.ArrayList");
            const TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');

            // This step is notably what defeats the most common case: network security config
            TrustManagerImpl.checkTrustedRecursive.implementation = function(a1, a2, a3, a4, a5, a6) {
                console.log('  --> Bypassing TrustManagerImpl checkTrusted ');
                return array_list.$new();
            }

            TrustManagerImpl.verifyChain.implementation = function (untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
                console.log('  --> Bypassing TrustManagerImpl verifyChain: ' + host);
                return untrustedChain;
            };
            console.log('[+] TrustManagerImpl');
        } catch (err) {
            console.log('[ ] TrustManagerImpl');
        }

        // OkHTTPv3 (quadruple bypass)
        try {
            // Bypass OkHTTPv3 {1}
            const okhttp3_Activity_1 = Java.use('okhttp3.CertificatePinner');
            okhttp3_Activity_1.check.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                console.log('  --> Bypassing OkHTTPv3 (list): ' + a);
                return;
            };
            console.log('[+] OkHTTPv3 (list)');
        } catch (err) {
            console.log('[ ] OkHTTPv3 (list)');
        }
        try {
            // Bypass OkHTTPv3 {2}
            // This method of CertificatePinner.check could be found in some old Android app
            const okhttp3_Activity_2 = Java.use('okhttp3.CertificatePinner');
            okhttp3_Activity_2.check.overload('java.lang.String', 'java.security.cert.Certificate').implementation = function (a, b) {
                console.log('  --> Bypassing OkHTTPv3 (cert): ' + a);
                return;
            };
            console.log('[+] OkHTTPv3 (cert)');
        } catch (err) {
            console.log('[ ] OkHTTPv3 (cert)');
        }
        try {
            // Bypass OkHTTPv3 {3}
            const okhttp3_Activity_3 = Java.use('okhttp3.CertificatePinner');
            okhttp3_Activity_3.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function (a, b) {
                console.log('  --> Bypassing OkHTTPv3 (cert array): ' + a);
                return;
            };
            console.log('[+] OkHTTPv3 (cert array)');
        } catch (err) {
            console.log('[ ] OkHTTPv3 (cert array)');
        }
        try {
            // Bypass OkHTTPv3 {4}
            const okhttp3_Activity_4 = Java.use('okhttp3.CertificatePinner');
            okhttp3_Activity_4['check$okhttp'].implementation = function (a, b) {
                console.log('  --> Bypassing OkHTTPv3 ($okhttp): ' + a);
                return;
            };
            console.log('[+] OkHTTPv3 ($okhttp)');
        } catch (err) {
            console.log('[ ] OkHTTPv3 ($okhttp)');
        }

        // Trustkit (triple bypass)
        try {
            // Bypass Trustkit {1}
            const trustkit_Activity_1 = Java.use('com.datatheorem.android.trustkit.pinning.OkHostnameVerifier');
            trustkit_Activity_1.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (a, b) {
                console.log('  --> Bypassing Trustkit OkHostnameVerifier(SSLSession): ' + a);
                return true;
            };
            console.log('[+] Trustkit OkHostnameVerifier(SSLSession)');
        } catch (err) {
            console.log('[ ] Trustkit OkHostnameVerifier(SSLSession)');
        }
        try {
            // Bypass Trustkit {2}
            const trustkit_Activity_2 = Java.use('com.datatheorem.android.trustkit.pinning.OkHostnameVerifier');
            trustkit_Activity_2.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (a, b) {
                console.log('  --> Bypassing Trustkit OkHostnameVerifier(cert): ' + a);
                return true;
            };
            console.log('[+] Trustkit OkHostnameVerifier(cert)');
        } catch (err) {
            console.log('[ ] Trustkit OkHostnameVerifier(cert)');
        }
        try {
            // Bypass Trustkit {3}
            const trustkit_PinningTrustManager = Java.use('com.datatheorem.android.trustkit.pinning.PinningTrustManager');
            trustkit_PinningTrustManager.checkServerTrusted.implementation = function () {
                console.log('  --> Bypassing Trustkit PinningTrustManager');
            };
            console.log('[+] Trustkit PinningTrustManager');
        } catch (err) {
            console.log('[ ] Trustkit PinningTrustManager');
        }

        // Appcelerator Titanium
        try {
            const appcelerator_PinningTrustManager = Java.use('appcelerator.https.PinningTrustManager');
            appcelerator_PinningTrustManager.checkServerTrusted.implementation = function () {
                console.log('  --> Bypassing Appcelerator PinningTrustManager');
            };
            console.log('[+] Appcelerator PinningTrustManager');
        } catch (err) {
            console.log('[ ] Appcelerator PinningTrustManager');
        }

        // OpenSSLSocketImpl Conscrypt
        try {
            const OpenSSLSocketImpl = Java.use('com.android.org.conscrypt.OpenSSLSocketImpl');
            OpenSSLSocketImpl.verifyCertificateChain.implementation = function (certRefs, JavaObject, authMethod) {
                console.log('  --> Bypassing OpenSSLSocketImpl Conscrypt');
            };
            console.log('[+] OpenSSLSocketImpl Conscrypt');
        } catch (err) {
            console.log('[ ] OpenSSLSocketImpl Conscrypt');
        }

        // OpenSSLEngineSocketImpl Conscrypt
        try {
            const OpenSSLEngineSocketImpl_Activity = Java.use('com.android.org.conscrypt.OpenSSLEngineSocketImpl');
            OpenSSLEngineSocketImpl_Activity.verifyCertificateChain.overload('[Ljava.lang.Long;', 'java.lang.String').implementation = function (a, b) {
                console.log('  --> Bypassing OpenSSLEngineSocketImpl Conscrypt: ' + b);
            };
            console.log('[+] OpenSSLEngineSocketImpl Conscrypt');
        } catch (err) {
            console.log('[ ] OpenSSLEngineSocketImpl Conscrypt');
        }

        // OpenSSLSocketImpl Apache Harmony
        try {
            const OpenSSLSocketImpl_Harmony = Java.use('org.apache.harmony.xnet.provider.jsse.OpenSSLSocketImpl');
            OpenSSLSocketImpl_Harmony.verifyCertificateChain.implementation = function (asn1DerEncodedCertificateChain, authMethod) {
                console.log('  --> Bypassing OpenSSLSocketImpl Apache Harmony');
            };
            console.log('[+] OpenSSLSocketImpl Apache Harmony');
        } catch (err) {
            console.log('[ ] OpenSSLSocketImpl Apache Harmony');
        }

        // PhoneGap sslCertificateChecker (https://github.com/EddyVerbruggen/SSLCertificateChecker-PhoneGap-Plugin)
        try {
            const phonegap_Activity = Java.use('nl.xservices.plugins.sslCertificateChecker');
            phonegap_Activity.execute.overload('java.lang.String', 'org.json.JSONArray', 'org.apache.cordova.CallbackContext').implementation = function (a, b, c) {
                console.log('  --> Bypassing PhoneGap sslCertificateChecker: ' + a);
                return true;
            };
            console.log('[+] PhoneGap sslCertificateChecker');
        } catch (err) {
            console.log('[ ] PhoneGap sslCertificateChecker');
        }

        // IBM MobileFirst pinTrustedCertificatePublicKey (double bypass)
        try {
            // Bypass IBM MobileFirst {1}
            const WLClient_Activity_1 = Java.use('com.worklight.wlclient.api.WLClient');
            WLClient_Activity_1.getInstance().pinTrustedCertificatePublicKey.overload('java.lang.String').implementation = function (cert) {
                console.log('  --> Bypassing IBM MobileFirst pinTrustedCertificatePublicKey (string): ' + cert);
                return;
            };
            console.log('[+] IBM MobileFirst pinTrustedCertificatePublicKey (string)');
        } catch (err) {
            console.log('[ ] IBM MobileFirst pinTrustedCertificatePublicKey (string)');
        }
        try {
            // Bypass IBM MobileFirst {2}
            const WLClient_Activity_2 = Java.use('com.worklight.wlclient.api.WLClient');
            WLClient_Activity_2.getInstance().pinTrustedCertificatePublicKey.overload('[Ljava.lang.String;').implementation = function (cert) {
                console.log('  --> Bypassing IBM MobileFirst pinTrustedCertificatePublicKey (string array): ' + cert);
                return;
            };
            console.log('[+] IBM MobileFirst pinTrustedCertificatePublicKey (string array)');
        } catch (err) {
            console.log('[ ] IBM MobileFirst pinTrustedCertificatePublicKey (string array)');
        }

        // IBM WorkLight (ancestor of MobileFirst) HostNameVerifierWithCertificatePinning (quadruple bypass)
        try {
            // Bypass IBM WorkLight {1}
            const worklight_Activity_1 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
            worklight_Activity_1.verify.overload('java.lang.String', 'javax.net.ssl.SSLSocket').implementation = function (a, b) {
                console.log('  --> Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSocket): ' + a);
                return;
            };
            console.log('[+] IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSocket)');
        } catch (err) {
            console.log('[ ] IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSocket)');
        }
        try {
            // Bypass IBM WorkLight {2}
            const worklight_Activity_2 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
            worklight_Activity_2.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (a, b) {
                console.log('  --> Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning (cert): ' + a);
                return;
            };
            console.log('[+] IBM WorkLight HostNameVerifierWithCertificatePinning (cert)');
        } catch (err) {
            console.log('[ ] IBM WorkLight HostNameVerifierWithCertificatePinning (cert)');
        }
        try {
            // Bypass IBM WorkLight {3}
            const worklight_Activity_3 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
            worklight_Activity_3.verify.overload('java.lang.String', '[Ljava.lang.String;', '[Ljava.lang.String;').implementation = function (a, b) {
                console.log('  --> Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning (string string): ' + a);
                return;
            };
            console.log('[+] IBM WorkLight HostNameVerifierWithCertificatePinning (string string)');
        } catch (err) {
            console.log('[ ] IBM WorkLight HostNameVerifierWithCertificatePinning (string string)');
        }
        try {
            // Bypass IBM WorkLight {4}
            const worklight_Activity_4 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
            worklight_Activity_4.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (a, b) {
                console.log('  --> Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSession): ' + a);
                return true;
            };
            console.log('[+] IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSession)');
        } catch (err) {
            console.log('[ ] IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSession)');
        }

        // Conscrypt CertPinManager
        try {
            const conscrypt_CertPinManager_Activity = Java.use('com.android.org.conscrypt.CertPinManager');
            conscrypt_CertPinManager_Activity.isChainValid.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                console.log('  --> Bypassing Conscrypt CertPinManager: ' + a);
                return true;
            };
            console.log('[+] Conscrypt CertPinManager');
        } catch (err) {
            console.log('[ ] Conscrypt CertPinManager');
        }

        // CWAC-Netsecurity (unofficial back-port pinner for Android<4.2) CertPinManager
        try {
            const cwac_CertPinManager_Activity = Java.use('com.commonsware.cwac.netsecurity.conscrypt.CertPinManager');
            cwac_CertPinManager_Activity.isChainValid.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                console.log('  --> Bypassing CWAC-Netsecurity CertPinManager: ' + a);
                return true;
            };
            console.log('[+] CWAC-Netsecurity CertPinManager');
        } catch (err) {
            console.log('[ ] CWAC-Netsecurity CertPinManager');
        }

        // Worklight Androidgap WLCertificatePinningPlugin
        try {
            const androidgap_WLCertificatePinningPlugin_Activity = Java.use('com.worklight.androidgap.plugin.WLCertificatePinningPlugin');
            androidgap_WLCertificatePinningPlugin_Activity.execute.overload('java.lang.String', 'org.json.JSONArray', 'org.apache.cordova.CallbackContext').implementation = function (a, b, c) {
                console.log('  --> Bypassing Worklight Androidgap WLCertificatePinningPlugin: ' + a);
                return true;
            };
            console.log('[+] Worklight Androidgap WLCertificatePinningPlugin');
        } catch (err) {
            console.log('[ ] Worklight Androidgap WLCertificatePinningPlugin');
        }

        // Netty FingerprintTrustManagerFactory
        try {
            const netty_FingerprintTrustManagerFactory = Java.use('io.netty.handler.ssl.util.FingerprintTrustManagerFactory');
            netty_FingerprintTrustManagerFactory.checkTrusted.implementation = function (type, chain) {
                console.log('  --> Bypassing Netty FingerprintTrustManagerFactory');
            };
            console.log('[+] Netty FingerprintTrustManagerFactory');
        } catch (err) {
            console.log('[ ] Netty FingerprintTrustManagerFactory');
        }

        // Squareup CertificatePinner [OkHTTP<v3] (double bypass)
        try {
            // Bypass Squareup CertificatePinner {1}
            const Squareup_CertificatePinner_Activity_1 = Java.use('com.squareup.okhttp.CertificatePinner');
            Squareup_CertificatePinner_Activity_1.check.overload('java.lang.String', 'java.security.cert.Certificate').implementation = function (a, b) {
                console.log('  --> Bypassing Squareup CertificatePinner (cert): ' + a);
                return;
            };
            console.log('[+] Squareup CertificatePinner (cert)');
        } catch (err) {
            console.log('[ ] Squareup CertificatePinner (cert)');
        }
        try {
            // Bypass Squareup CertificatePinner {2}
            const Squareup_CertificatePinner_Activity_2 = Java.use('com.squareup.okhttp.CertificatePinner');
            Squareup_CertificatePinner_Activity_2.check.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                console.log('  --> Bypassing Squareup CertificatePinner (list): ' + a);
                return;
            };
            console.log('[+] Squareup CertificatePinner (list)');
        } catch (err) {
            console.log('[ ] Squareup CertificatePinner (list)');
        }

        // Squareup OkHostnameVerifier [OkHTTP v3] (double bypass)
        try {
            // Bypass Squareup OkHostnameVerifier {1}
            const Squareup_OkHostnameVerifier_Activity_1 = Java.use('com.squareup.okhttp.internal.tls.OkHostnameVerifier');
            Squareup_OkHostnameVerifier_Activity_1.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (a, b) {
                console.log('  --> Bypassing Squareup OkHostnameVerifier (cert): ' + a);
                return true;
            };
            console.log('[+] Squareup OkHostnameVerifier (cert)');
        } catch (err) {
            console.log('[ ] Squareup OkHostnameVerifier (cert)');
        }
        try {
            // Bypass Squareup OkHostnameVerifier {2}
            const Squareup_OkHostnameVerifier_Activity_2 = Java.use('com.squareup.okhttp.internal.tls.OkHostnameVerifier');
            Squareup_OkHostnameVerifier_Activity_2.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (a, b) {
                console.log('  --> Bypassing Squareup OkHostnameVerifier (SSLSession): ' + a);
                return true;
            };
            console.log('[+] Squareup OkHostnameVerifier (SSLSession)');
        } catch (err) {
            console.log('[ ] Squareup OkHostnameVerifier (SSLSession)');
        }

        // Android WebViewClient (double bypass)
        try {
            // Bypass WebViewClient {1} (deprecated from Android 6)
            const AndroidWebViewClient_Activity_1 = Java.use('android.webkit.WebViewClient');
            AndroidWebViewClient_Activity_1.onReceivedSslError.overload('android.webkit.WebView', 'android.webkit.SslErrorHandler', 'android.net.http.SslError').implementation = function (obj1, obj2, obj3) {
                console.log('  --> Bypassing Android WebViewClient (SslErrorHandler)');
            };
            console.log('[+] Android WebViewClient (SslErrorHandler)');
        } catch (err) {
            console.log('[ ] Android WebViewClient (SslErrorHandler)');
        }
        try {
            // Bypass WebViewClient {2}
            const AndroidWebViewClient_Activity_2 = Java.use('android.webkit.WebViewClient');
            AndroidWebViewClient_Activity_2.onReceivedSslError.overload('android.webkit.WebView', 'android.webkit.WebResourceRequest', 'android.webkit.WebResourceError').implementation = function (obj1, obj2, obj3) {
                console.log('  --> Bypassing Android WebViewClient (WebResourceError)');
            };
            console.log('[+] Android WebViewClient (WebResourceError)');
        } catch (err) {
            console.log('[ ] Android WebViewClient (WebResourceError)');
        }

        // Apache Cordova WebViewClient
        try {
            const CordovaWebViewClient_Activity = Java.use('org.apache.cordova.CordovaWebViewClient');
            CordovaWebViewClient_Activity.onReceivedSslError.overload('android.webkit.WebView', 'android.webkit.SslErrorHandler', 'android.net.http.SslError').implementation = function (obj1, obj2, obj3) {
                console.log('  --> Bypassing Apache Cordova WebViewClient');
                obj3.proceed();
            };
        } catch (err) {
            console.log('[ ] Apache Cordova WebViewClient');
        }

        // Boye AbstractVerifier
        try {
            const boye_AbstractVerifier = Java.use('ch.boye.httpclientandroidlib.conn.ssl.AbstractVerifier');
            boye_AbstractVerifier.verify.implementation = function (host, ssl) {
                console.log('  --> Bypassing Boye AbstractVerifier: ' + host);
            };
        } catch (err) {
            console.log('[ ] Boye AbstractVerifier');
        }

		// Appmattus
		try {
            const appmatus_Activity = Java.use('com.appmattus.certificatetransparency.internal.verifier.CertificateTransparencyInterceptor');
            appmatus_Activity['intercept'].implementation = function (a) {
                console.log('  --> Bypassing Appmattus (Transparency)');
                return a.proceed(a.request());
            };
            console.log('[+] Appmattus (Transparency)');
        } catch (err) {
            console.log('[ ] Appmattus (Transparency)');
        }

        console.log("Unpinning setup completed");
        console.log("---");
    });

}, 0);

Java.perform(function () {
	console.log('')
	console.log('===')
	console.log('* Injecting hooks into common certificate pinning methods *')
	console.log('===')

	var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
	var SSLContext = Java.use('javax.net.ssl.SSLContext');

	// build fake trust manager
	var TrustManager = Java.registerClass({
		name: 'com.sensepost.test.TrustManager',
		implements: [X509TrustManager],
		methods: {
			checkClientTrusted: function (chain, authType) {
			},
			checkServerTrusted: function (chain, authType) {
			},
			getAcceptedIssuers: function () {
				return [];
			}
		}
	});

	// pass our own custom trust manager through when requested
	var TrustManagers = [TrustManager.$new()];
	var SSLContext_init = SSLContext.init.overload(
		'[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom'
	);
	SSLContext_init.implementation = function (keyManager, trustManager, secureRandom) {
		console.log('! Intercepted trustmanager request');
		SSLContext_init.call(this, keyManager, TrustManagers, secureRandom);
	};

	console.log('* Setup custom trust manager');

	// okhttp3
	try {
		var CertificatePinner = Java.use('okhttp3.CertificatePinner');
		CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function (str) {
			console.log('! Intercepted okhttp3: ' + str);
			return;
		};

		console.log('* Setup okhttp3 pinning')
	} catch(err) {
		console.log('* Unable to hook into okhttp3 pinner')
	}

	// trustkit
	try {
		var Activity = Java.use("com.datatheorem.android.trustkit.pinning.OkHostnameVerifier");
		Activity.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (str) {
			console.log('! Intercepted trustkit{1}: ' + str);
			return true;
		};

		Activity.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (str) {
			console.log('! Intercepted trustkit{2}: ' + str);
			return true;
		};

		console.log('* Setup trustkit pinning')
	} catch(err) {
		console.log('* Unable to hook into trustkit pinner')
	}

	// TrustManagerImpl
	try {
		var TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');
		TrustManagerImpl.verifyChain.implementation = function (untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
			console.log('! Intercepted TrustManagerImp: ' + host);
			return untrustedChain;
		}

		console.log('* Setup TrustManagerImpl pinning')
	} catch (err) {
		console.log('* Unable to hook into TrustManagerImpl')
	}

	// Appcelerator
	try {
		var PinningTrustManager = Java.use('appcelerator.https.PinningTrustManager');
		PinningTrustManager.checkServerTrusted.implementation = function () {
			console.log('! Intercepted Appcelerator');
		}

		console.log('* Setup Appcelerator pinning')
	} catch (err) {
		console.log('* Unable to hook into Appcelerator pinning')
	}
	
	// ByPass SSL pinning for Android 7+
	var array_list = Java.use("java.util.ArrayList");
	var ApiClient = Java.use('com.android.org.conscrypt.TrustManagerImpl');
	ApiClient.checkTrustedRecursive.implementation = function(a1,a2,a3,a4,a5,a6) {
		console.log('Bypassing SSL Pinning');
		var k = array_list.$new();
		return k;
	}

	// Force mode debug for all webview
	var WebView = Java.use('android.webkit.WebView');
	WebView.loadUrl.overload("java.lang.String").implementation = function (s) {
		console.log('Enable webview debug for URL: '+s.toString());
		this.setWebContentsDebuggingEnabled(true);
		this.loadUrl.overload("java.lang.String").call(this, s);
	};
});
setTimeout(function () {
    Java.perform(function () {
        console.log("---");
        console.log("Unpinning Android app...");
        try {
            const UnverifiedCertError = Java.use('javax.net.ssl.SSLPeerUnverifiedException');
            UnverifiedCertError.$init.implementation = function (str) {
                console.log('  --> Unexpected SSL verification failure, adding dynamic patch...');

                try {
                    const stackTrace = Java.use('java.lang.Thread').currentThread().getStackTrace();
                    const exceptionStackIndex = stackTrace.findIndex(stack =>
                        stack.getClassName() === "javax.net.ssl.SSLPeerUnverifiedException"
                    );
                    const callingFunctionStack = stackTrace[exceptionStackIndex + 1];

                    const className = callingFunctionStack.getClassName();
                    const methodName = callingFunctionStack.getMethodName();

                    console.log(`      Thrown by ${className}->${methodName}`);

                    const callingClass = Java.use(className);
                    const callingMethod = callingClass[methodName];

                    if (callingMethod.implementation) return; // Already patched by Frida - skip it

                    console.log('      Attempting to patch automatically...');
                    const returnTypeName = callingMethod.returnType.type;

                    callingMethod.implementation = function () {
                        console.log(`  --> Bypassing ${className}->${methodName} (automatic exception patch)`);

                        // This is not a perfect fix! Most unknown cases like this are really just
                        // checkCert(cert) methods though, so doing nothing is perfect, and if we
                        // do need an actual return value then this is probably the best we can do,
                        // and at least we're logging the method name so you can patch it manually:

                        if (returnTypeName === 'void') {
                            return;
                        } else {
                            return null;
                        }
                    };

                    console.log(`      [+] ${className}->${methodName} (automatic exception patch)`);
                } catch (e) {
                    console.log('      [ ] Failed to automatically patch failure');
                }

                return this.$init(str);
            };
            console.log('[+] SSLPeerUnverifiedException auto-patcher');
        } catch (err) {
            console.log('[ ] SSLPeerUnverifiedException auto-patcher');
        }

        /// -- Specific targeted hooks: -- ///

        // HttpsURLConnection
        try {
            const HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
            HttpsURLConnection.setDefaultHostnameVerifier.implementation = function (hostnameVerifier) {
                console.log('  --> Bypassing HttpsURLConnection (setDefaultHostnameVerifier)');
                return; // Do nothing, i.e. don't change the hostname verifier
            };
            console.log('[+] HttpsURLConnection (setDefaultHostnameVerifier)');
        } catch (err) {
            console.log('[ ] HttpsURLConnection (setDefaultHostnameVerifier)');
        }
        try {
            const HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
            HttpsURLConnection.setSSLSocketFactory.implementation = function (SSLSocketFactory) {
                console.log('  --> Bypassing HttpsURLConnection (setSSLSocketFactory)');
                return; // Do nothing, i.e. don't change the SSL socket factory
            };
            console.log('[+] HttpsURLConnection (setSSLSocketFactory)');
        } catch (err) {
            console.log('[ ] HttpsURLConnection (setSSLSocketFactory)');
        }
        try {
            const HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
            HttpsURLConnection.setHostnameVerifier.implementation = function (hostnameVerifier) {
                console.log('  --> Bypassing HttpsURLConnection (setHostnameVerifier)');
                return; // Do nothing, i.e. don't change the hostname verifier
            };
            console.log('[+] HttpsURLConnection (setHostnameVerifier)');
        } catch (err) {
            console.log('[ ] HttpsURLConnection (setHostnameVerifier)');
        }

        // SSLContext
        try {
            const X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
            const SSLContext = Java.use('javax.net.ssl.SSLContext');

            const TrustManager = Java.registerClass({
                // Implement a custom TrustManager
                name: 'dev.asd.test.TrustManager',
                implements: [X509TrustManager],
                methods: {
                    checkClientTrusted: function (chain, authType) { },
                    checkServerTrusted: function (chain, authType) { },
                    getAcceptedIssuers: function () { return []; }
                }
            });

            // Prepare the TrustManager array to pass to SSLContext.init()
            const TrustManagers = [TrustManager.$new()];

            // Get a handle on the init() on the SSLContext class
            const SSLContext_init = SSLContext.init.overload(
                '[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom'
            );

            // Override the init method, specifying the custom TrustManager
            SSLContext_init.implementation = function (keyManager, trustManager, secureRandom) {
                console.log('  --> Bypassing Trustmanager (Android < 7) request');
                SSLContext_init.call(this, keyManager, TrustManagers, secureRandom);
            };
            console.log('[+] SSLContext');
        } catch (err) {
            console.log('[ ] SSLContext');
        }

        // TrustManagerImpl (Android > 7)
        try {
            const array_list = Java.use("java.util.ArrayList");
            const TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');

            // This step is notably what defeats the most common case: network security config
            TrustManagerImpl.checkTrustedRecursive.implementation = function(a1, a2, a3, a4, a5, a6) {
                console.log('  --> Bypassing TrustManagerImpl checkTrusted ');
                return array_list.$new();
            }

            TrustManagerImpl.verifyChain.implementation = function (untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
                console.log('  --> Bypassing TrustManagerImpl verifyChain: ' + host);
                return untrustedChain;
            };
            console.log('[+] TrustManagerImpl');
        } catch (err) {
            console.log('[ ] TrustManagerImpl');
        }

        // OkHTTPv3 (quadruple bypass)
        try {
            // Bypass OkHTTPv3 {1}
            const okhttp3_Activity_1 = Java.use('okhttp3.CertificatePinner');
            okhttp3_Activity_1.check.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                console.log('  --> Bypassing OkHTTPv3 (list): ' + a);
                return;
            };
            console.log('[+] OkHTTPv3 (list)');
        } catch (err) {
            console.log('[ ] OkHTTPv3 (list)');
        }
        try {
            // Bypass OkHTTPv3 {2}
            // This method of CertificatePinner.check could be found in some old Android app
            const okhttp3_Activity_2 = Java.use('okhttp3.CertificatePinner');
            okhttp3_Activity_2.check.overload('java.lang.String', 'java.security.cert.Certificate').implementation = function (a, b) {
                console.log('  --> Bypassing OkHTTPv3 (cert): ' + a);
                return;
            };
            console.log('[+] OkHTTPv3 (cert)');
        } catch (err) {
            console.log('[ ] OkHTTPv3 (cert)');
        }
        try {
            // Bypass OkHTTPv3 {3}
            const okhttp3_Activity_3 = Java.use('okhttp3.CertificatePinner');
            okhttp3_Activity_3.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function (a, b) {
                console.log('  --> Bypassing OkHTTPv3 (cert array): ' + a);
                return;
            };
            console.log('[+] OkHTTPv3 (cert array)');
        } catch (err) {
            console.log('[ ] OkHTTPv3 (cert array)');
        }
        try {
            // Bypass OkHTTPv3 {4}
            const okhttp3_Activity_4 = Java.use('okhttp3.CertificatePinner');
            okhttp3_Activity_4['check$okhttp'].implementation = function (a, b) {
                console.log('  --> Bypassing OkHTTPv3 ($okhttp): ' + a);
                return;
            };
            console.log('[+] OkHTTPv3 ($okhttp)');
        } catch (err) {
            console.log('[ ] OkHTTPv3 ($okhttp)');
        }

        // Trustkit (triple bypass)
        try {
            // Bypass Trustkit {1}
            const trustkit_Activity_1 = Java.use('com.datatheorem.android.trustkit.pinning.OkHostnameVerifier');
            trustkit_Activity_1.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (a, b) {
                console.log('  --> Bypassing Trustkit OkHostnameVerifier(SSLSession): ' + a);
                return true;
            };
            console.log('[+] Trustkit OkHostnameVerifier(SSLSession)');
        } catch (err) {
            console.log('[ ] Trustkit OkHostnameVerifier(SSLSession)');
        }
        try {
            // Bypass Trustkit {2}
            const trustkit_Activity_2 = Java.use('com.datatheorem.android.trustkit.pinning.OkHostnameVerifier');
            trustkit_Activity_2.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (a, b) {
                console.log('  --> Bypassing Trustkit OkHostnameVerifier(cert): ' + a);
                return true;
            };
            console.log('[+] Trustkit OkHostnameVerifier(cert)');
        } catch (err) {
            console.log('[ ] Trustkit OkHostnameVerifier(cert)');
        }
        try {
            // Bypass Trustkit {3}
            const trustkit_PinningTrustManager = Java.use('com.datatheorem.android.trustkit.pinning.PinningTrustManager');
            trustkit_PinningTrustManager.checkServerTrusted.implementation = function () {
                console.log('  --> Bypassing Trustkit PinningTrustManager');
            };
            console.log('[+] Trustkit PinningTrustManager');
        } catch (err) {
            console.log('[ ] Trustkit PinningTrustManager');
        }

        // Appcelerator Titanium
        try {
            const appcelerator_PinningTrustManager = Java.use('appcelerator.https.PinningTrustManager');
            appcelerator_PinningTrustManager.checkServerTrusted.implementation = function () {
                console.log('  --> Bypassing Appcelerator PinningTrustManager');
            };
            console.log('[+] Appcelerator PinningTrustManager');
        } catch (err) {
            console.log('[ ] Appcelerator PinningTrustManager');
        }

        // OpenSSLSocketImpl Conscrypt
        try {
            const OpenSSLSocketImpl = Java.use('com.android.org.conscrypt.OpenSSLSocketImpl');
            OpenSSLSocketImpl.verifyCertificateChain.implementation = function (certRefs, JavaObject, authMethod) {
                console.log('  --> Bypassing OpenSSLSocketImpl Conscrypt');
            };
            console.log('[+] OpenSSLSocketImpl Conscrypt');
        } catch (err) {
            console.log('[ ] OpenSSLSocketImpl Conscrypt');
        }

        // OpenSSLEngineSocketImpl Conscrypt
        try {
            const OpenSSLEngineSocketImpl_Activity = Java.use('com.android.org.conscrypt.OpenSSLEngineSocketImpl');
            OpenSSLEngineSocketImpl_Activity.verifyCertificateChain.overload('[Ljava.lang.Long;', 'java.lang.String').implementation = function (a, b) {
                console.log('  --> Bypassing OpenSSLEngineSocketImpl Conscrypt: ' + b);
            };
            console.log('[+] OpenSSLEngineSocketImpl Conscrypt');
        } catch (err) {
            console.log('[ ] OpenSSLEngineSocketImpl Conscrypt');
        }

        // OpenSSLSocketImpl Apache Harmony
        try {
            const OpenSSLSocketImpl_Harmony = Java.use('org.apache.harmony.xnet.provider.jsse.OpenSSLSocketImpl');
            OpenSSLSocketImpl_Harmony.verifyCertificateChain.implementation = function (asn1DerEncodedCertificateChain, authMethod) {
                console.log('  --> Bypassing OpenSSLSocketImpl Apache Harmony');
            };
            console.log('[+] OpenSSLSocketImpl Apache Harmony');
        } catch (err) {
            console.log('[ ] OpenSSLSocketImpl Apache Harmony');
        }

        // PhoneGap sslCertificateChecker (https://github.com/EddyVerbruggen/SSLCertificateChecker-PhoneGap-Plugin)
        try {
            const phonegap_Activity = Java.use('nl.xservices.plugins.sslCertificateChecker');
            phonegap_Activity.execute.overload('java.lang.String', 'org.json.JSONArray', 'org.apache.cordova.CallbackContext').implementation = function (a, b, c) {
                console.log('  --> Bypassing PhoneGap sslCertificateChecker: ' + a);
                return true;
            };
            console.log('[+] PhoneGap sslCertificateChecker');
        } catch (err) {
            console.log('[ ] PhoneGap sslCertificateChecker');
        }

        // IBM MobileFirst pinTrustedCertificatePublicKey (double bypass)
        try {
            // Bypass IBM MobileFirst {1}
            const WLClient_Activity_1 = Java.use('com.worklight.wlclient.api.WLClient');
            WLClient_Activity_1.getInstance().pinTrustedCertificatePublicKey.overload('java.lang.String').implementation = function (cert) {
                console.log('  --> Bypassing IBM MobileFirst pinTrustedCertificatePublicKey (string): ' + cert);
                return;
            };
            console.log('[+] IBM MobileFirst pinTrustedCertificatePublicKey (string)');
        } catch (err) {
            console.log('[ ] IBM MobileFirst pinTrustedCertificatePublicKey (string)');
        }
        try {
            // Bypass IBM MobileFirst {2}
            const WLClient_Activity_2 = Java.use('com.worklight.wlclient.api.WLClient');
            WLClient_Activity_2.getInstance().pinTrustedCertificatePublicKey.overload('[Ljava.lang.String;').implementation = function (cert) {
                console.log('  --> Bypassing IBM MobileFirst pinTrustedCertificatePublicKey (string array): ' + cert);
                return;
            };
            console.log('[+] IBM MobileFirst pinTrustedCertificatePublicKey (string array)');
        } catch (err) {
            console.log('[ ] IBM MobileFirst pinTrustedCertificatePublicKey (string array)');
        }

        // IBM WorkLight (ancestor of MobileFirst) HostNameVerifierWithCertificatePinning (quadruple bypass)
        try {
            // Bypass IBM WorkLight {1}
            const worklight_Activity_1 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
            worklight_Activity_1.verify.overload('java.lang.String', 'javax.net.ssl.SSLSocket').implementation = function (a, b) {
                console.log('  --> Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSocket): ' + a);
                return;
            };
            console.log('[+] IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSocket)');
        } catch (err) {
            console.log('[ ] IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSocket)');
        }
        try {
            // Bypass IBM WorkLight {2}
            const worklight_Activity_2 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
            worklight_Activity_2.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (a, b) {
                console.log('  --> Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning (cert): ' + a);
                return;
            };
            console.log('[+] IBM WorkLight HostNameVerifierWithCertificatePinning (cert)');
        } catch (err) {
            console.log('[ ] IBM WorkLight HostNameVerifierWithCertificatePinning (cert)');
        }
        try {
            // Bypass IBM WorkLight {3}
            const worklight_Activity_3 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
            worklight_Activity_3.verify.overload('java.lang.String', '[Ljava.lang.String;', '[Ljava.lang.String;').implementation = function (a, b) {
                console.log('  --> Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning (string string): ' + a);
                return;
            };
            console.log('[+] IBM WorkLight HostNameVerifierWithCertificatePinning (string string)');
        } catch (err) {
            console.log('[ ] IBM WorkLight HostNameVerifierWithCertificatePinning (string string)');
        }
        try {
            // Bypass IBM WorkLight {4}
            const worklight_Activity_4 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
            worklight_Activity_4.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (a, b) {
                console.log('  --> Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSession): ' + a);
                return true;
            };
            console.log('[+] IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSession)');
        } catch (err) {
            console.log('[ ] IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSession)');
        }

        // Conscrypt CertPinManager
        try {
            const conscrypt_CertPinManager_Activity = Java.use('com.android.org.conscrypt.CertPinManager');
            conscrypt_CertPinManager_Activity.isChainValid.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                console.log('  --> Bypassing Conscrypt CertPinManager: ' + a);
                return true;
            };
            console.log('[+] Conscrypt CertPinManager');
        } catch (err) {
            console.log('[ ] Conscrypt CertPinManager');
        }

        // CWAC-Netsecurity (unofficial back-port pinner for Android<4.2) CertPinManager
        try {
            const cwac_CertPinManager_Activity = Java.use('com.commonsware.cwac.netsecurity.conscrypt.CertPinManager');
            cwac_CertPinManager_Activity.isChainValid.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                console.log('  --> Bypassing CWAC-Netsecurity CertPinManager: ' + a);
                return true;
            };
            console.log('[+] CWAC-Netsecurity CertPinManager');
        } catch (err) {
            console.log('[ ] CWAC-Netsecurity CertPinManager');
        }

        // Worklight Androidgap WLCertificatePinningPlugin
        try {
            const androidgap_WLCertificatePinningPlugin_Activity = Java.use('com.worklight.androidgap.plugin.WLCertificatePinningPlugin');
            androidgap_WLCertificatePinningPlugin_Activity.execute.overload('java.lang.String', 'org.json.JSONArray', 'org.apache.cordova.CallbackContext').implementation = function (a, b, c) {
                console.log('  --> Bypassing Worklight Androidgap WLCertificatePinningPlugin: ' + a);
                return true;
            };
            console.log('[+] Worklight Androidgap WLCertificatePinningPlugin');
        } catch (err) {
            console.log('[ ] Worklight Androidgap WLCertificatePinningPlugin');
        }

        // Netty FingerprintTrustManagerFactory
        try {
            const netty_FingerprintTrustManagerFactory = Java.use('io.netty.handler.ssl.util.FingerprintTrustManagerFactory');
            netty_FingerprintTrustManagerFactory.checkTrusted.implementation = function (type, chain) {
                console.log('  --> Bypassing Netty FingerprintTrustManagerFactory');
            };
            console.log('[+] Netty FingerprintTrustManagerFactory');
        } catch (err) {
            console.log('[ ] Netty FingerprintTrustManagerFactory');
        }

        // Squareup CertificatePinner [OkHTTP<v3] (double bypass)
        try {
            // Bypass Squareup CertificatePinner {1}
            const Squareup_CertificatePinner_Activity_1 = Java.use('com.squareup.okhttp.CertificatePinner');
            Squareup_CertificatePinner_Activity_1.check.overload('java.lang.String', 'java.security.cert.Certificate').implementation = function (a, b) {
                console.log('  --> Bypassing Squareup CertificatePinner (cert): ' + a);
                return;
            };
            console.log('[+] Squareup CertificatePinner (cert)');
        } catch (err) {
            console.log('[ ] Squareup CertificatePinner (cert)');
        }
        try {
            // Bypass Squareup CertificatePinner {2}
            const Squareup_CertificatePinner_Activity_2 = Java.use('com.squareup.okhttp.CertificatePinner');
            Squareup_CertificatePinner_Activity_2.check.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                console.log('  --> Bypassing Squareup CertificatePinner (list): ' + a);
                return;
            };
            console.log('[+] Squareup CertificatePinner (list)');
        } catch (err) {
            console.log('[ ] Squareup CertificatePinner (list)');
        }

        // Squareup OkHostnameVerifier [OkHTTP v3] (double bypass)
        try {
            // Bypass Squareup OkHostnameVerifier {1}
            const Squareup_OkHostnameVerifier_Activity_1 = Java.use('com.squareup.okhttp.internal.tls.OkHostnameVerifier');
            Squareup_OkHostnameVerifier_Activity_1.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (a, b) {
                console.log('  --> Bypassing Squareup OkHostnameVerifier (cert): ' + a);
                return true;
            };
            console.log('[+] Squareup OkHostnameVerifier (cert)');
        } catch (err) {
            console.log('[ ] Squareup OkHostnameVerifier (cert)');
        }
        try {
            // Bypass Squareup OkHostnameVerifier {2}
            const Squareup_OkHostnameVerifier_Activity_2 = Java.use('com.squareup.okhttp.internal.tls.OkHostnameVerifier');
            Squareup_OkHostnameVerifier_Activity_2.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (a, b) {
                console.log('  --> Bypassing Squareup OkHostnameVerifier (SSLSession): ' + a);
                return true;
            };
            console.log('[+] Squareup OkHostnameVerifier (SSLSession)');
        } catch (err) {
            console.log('[ ] Squareup OkHostnameVerifier (SSLSession)');
        }

        // Android WebViewClient (double bypass)
        try {
            // Bypass WebViewClient {1} (deprecated from Android 6)
            const AndroidWebViewClient_Activity_1 = Java.use('android.webkit.WebViewClient');
            AndroidWebViewClient_Activity_1.onReceivedSslError.overload('android.webkit.WebView', 'android.webkit.SslErrorHandler', 'android.net.http.SslError').implementation = function (obj1, obj2, obj3) {
                console.log('  --> Bypassing Android WebViewClient (SslErrorHandler)');
            };
            console.log('[+] Android WebViewClient (SslErrorHandler)');
        } catch (err) {
            console.log('[ ] Android WebViewClient (SslErrorHandler)');
        }
        try {
            // Bypass WebViewClient {2}
            const AndroidWebViewClient_Activity_2 = Java.use('android.webkit.WebViewClient');
            AndroidWebViewClient_Activity_2.onReceivedSslError.overload('android.webkit.WebView', 'android.webkit.WebResourceRequest', 'android.webkit.WebResourceError').implementation = function (obj1, obj2, obj3) {
                console.log('  --> Bypassing Android WebViewClient (WebResourceError)');
            };
            console.log('[+] Android WebViewClient (WebResourceError)');
        } catch (err) {
            console.log('[ ] Android WebViewClient (WebResourceError)');
        }

        // Apache Cordova WebViewClient
        try {
            const CordovaWebViewClient_Activity = Java.use('org.apache.cordova.CordovaWebViewClient');
            CordovaWebViewClient_Activity.onReceivedSslError.overload('android.webkit.WebView', 'android.webkit.SslErrorHandler', 'android.net.http.SslError').implementation = function (obj1, obj2, obj3) {
                console.log('  --> Bypassing Apache Cordova WebViewClient');
                obj3.proceed();
            };
        } catch (err) {
            console.log('[ ] Apache Cordova WebViewClient');
        }

        // Boye AbstractVerifier
        try {
            const boye_AbstractVerifier = Java.use('ch.boye.httpclientandroidlib.conn.ssl.AbstractVerifier');
            boye_AbstractVerifier.verify.implementation = function (host, ssl) {
                console.log('  --> Bypassing Boye AbstractVerifier: ' + host);
            };
        } catch (err) {
            console.log('[ ] Boye AbstractVerifier');
        }

		// Appmattus
		try {
            const appmatus_Activity = Java.use('com.appmattus.certificatetransparency.internal.verifier.CertificateTransparencyInterceptor');
            appmatus_Activity['intercept'].implementation = function (a) {
                console.log('  --> Bypassing Appmattus (Transparency)');
                return a.proceed(a.request());
            };
            console.log('[+] Appmattus (Transparency)');
        } catch (err) {
            console.log('[ ] Appmattus (Transparency)');
        }

        console.log("Unpinning setup completed");
        console.log("---");
    });

}, 0);
setTimeout(function() {
	Java.perform(function() {
		console.log('');
		console.log('======');
		console.log('[#] Android Bypass for various Certificate Pinning methods [#]');
		console.log('======');


		var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
		var SSLContext = Java.use('javax.net.ssl.SSLContext');
		var TrustManager = Java.registerClass({
			name: 'dev.asd.test.TrustManager',
			implements: [X509TrustManager],
			methods: {
				checkClientTrusted: function(chain, authType) {},
				checkServerTrusted: function(chain, authType) {},
				getAcceptedIssuers: function() {return []; }
			}
		});
		// Prepare the TrustManager array to pass to SSLContext.init()
		var TrustManagers = [TrustManager.$new()];
		// Get a handle on the init() on the SSLContext class
		var SSLContext_init = SSLContext.init.overload(
			'[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom');
		try {
			// Override the init method, specifying the custom TrustManager
			SSLContext_init.implementation = function(keyManager, trustManager, secureRandom) {
				console.log('[+] Bypassing Trustmanager (Android < 7) pinner');
				SSLContext_init.call(this, keyManager, TrustManagers, secureRandom);
			};
		} catch (err) {
			console.log('[-] TrustManager (Android < 7) pinner not found');
			//console.log(err);
		}



	
		// OkHTTPv3 (quadruple bypass) //
		/////////////////////////////////
		try {
			// Bypass OkHTTPv3 {1}
			var okhttp3_Activity_1 = Java.use('okhttp3.CertificatePinner');    
			okhttp3_Activity_1.check.overload('java.lang.String', 'java.util.List').implementation = function(a, b) {                              
				console.log('[+] Bypassing OkHTTPv3 {1}: ' + a);
				return;
			};
		} catch (err) {
			console.log('[-] OkHTTPv3 {1} pinner not found');
			//console.log(err);
		}
		try {
			// Bypass OkHTTPv3 {2}
			// This method of CertificatePinner.check is deprecated but could be found in some old Android apps
			var okhttp3_Activity_2 = Java.use('okhttp3.CertificatePinner');    
			okhttp3_Activity_2.check.overload('java.lang.String', 'java.security.cert.Certificate').implementation = function(a, b) {
				console.log('[+] Bypassing OkHTTPv3 {2}: ' + a);
				return;
			};
		} catch (err) {
			console.log('[-] OkHTTPv3 {2} pinner not found');
			//console.log(err);
		}
		try {
			// Bypass OkHTTPv3 {3}
			var okhttp3_Activity_3 = Java.use('okhttp3.CertificatePinner');    
			okhttp3_Activity_3.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function(a, b) {
				console.log('[+] Bypassing OkHTTPv3 {3}: ' + a);
				return;
			};
		} catch(err) {
			console.log('[-] OkHTTPv3 {3} pinner not found');
			//console.log(err);
		}
		try {
			// Bypass OkHTTPv3 {4}
			var okhttp3_Activity_4 = Java.use('okhttp3.CertificatePinner');    
			//okhttp3_Activity_4['check$okhttp'].implementation = function(a, b) {
			okhttp3_Activity_4.check$okhttp.overload('java.lang.String', 'kotlin.jvm.functions.Function0').implementation = function(a, b) {		
				console.log('[+] Bypassing OkHTTPv3 {4}: ' + a);
				return;
			};
		} catch(err) {
			console.log('[-] OkHTTPv3 {4} pinner not found');
			//console.log(err);
		}

	

	
		// Trustkit (triple bypass) //
		//////////////////////////////
		try {
			// Bypass Trustkit {1}
			var trustkit_Activity_1 = Java.use('com.datatheorem.android.trustkit.pinning.OkHostnameVerifier');
			trustkit_Activity_1.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function(a, b) {
				console.log('[+] Bypassing Trustkit {1}: ' + a);
				return true;
			};
		} catch (err) {
			console.log('[-] Trustkit {1} pinner not found');
			//console.log(err);
		}
		try {
			// Bypass Trustkit {2}
			var trustkit_Activity_2 = Java.use('com.datatheorem.android.trustkit.pinning.OkHostnameVerifier');
			trustkit_Activity_2.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function(a, b) {
				console.log('[+] Bypassing Trustkit {2}: ' + a);
				return true;
			};
		} catch (err) {
			console.log('[-] Trustkit {2} pinner not found');
			//console.log(err);
		}
		try {
			// Bypass Trustkit {3}
			var trustkit_PinningTrustManager = Java.use('com.datatheorem.android.trustkit.pinning.PinningTrustManager');
			trustkit_PinningTrustManager.checkServerTrusted.overload('[Ljava.security.cert.X509Certificate;', 'java.lang.String').implementation = function(chain, authType) {
				console.log('[+] Bypassing Trustkit {3}');
				//return;
			};
		} catch (err) {
			console.log('[-] Trustkit {3} pinner not found');
			//console.log(err);
		}
		
	
	
  
		// TrustManagerImpl (Android > 7) //
		////////////////////////////////////
		try {
			// Bypass TrustManagerImpl (Android > 7) {1}
			var array_list = Java.use("java.util.ArrayList");
			var TrustManagerImpl_Activity_1 = Java.use('com.android.org.conscrypt.TrustManagerImpl');
			TrustManagerImpl_Activity_1.checkTrustedRecursive.implementation = function(certs, ocspData, tlsSctData, host, clientAuth, untrustedChain, trustAnchorChain, used) {
				console.log('[+] Bypassing TrustManagerImpl (Android > 7) checkTrustedRecursive check: '+ host);
				return array_list.$new();
			};
		} catch (err) {
			console.log('[-] TrustManagerImpl (Android > 7) checkTrustedRecursive check not found');
			//console.log(err);
		}  
		try {
			// Bypass TrustManagerImpl (Android > 7) {2} (probably no more necessary)
			var TrustManagerImpl_Activity_2 = Java.use('com.android.org.conscrypt.TrustManagerImpl');
			TrustManagerImpl_Activity_2.verifyChain.implementation = function(untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
				console.log('[+] Bypassing TrustManagerImpl (Android > 7) verifyChain check: ' + host);
				return untrustedChain;
			};   
		} catch (err) {
			console.log('[-] TrustManagerImpl (Android > 7) verifyChain check not found');
			//console.log(err);
		}

  
  
		

		// Appcelerator Titanium PinningTrustManager //
		///////////////////////////////////////////////
		try {
			var appcelerator_PinningTrustManager = Java.use('appcelerator.https.PinningTrustManager');
			appcelerator_PinningTrustManager.checkServerTrusted.implementation = function(chain, authType) {
				console.log('[+] Bypassing Appcelerator PinningTrustManager');
				return;
			};
		} catch (err) {
			console.log('[-] Appcelerator PinningTrustManager pinner not found');
			//console.log(err);
		}




		// Fabric PinningTrustManager //
		////////////////////////////////
		try {
			var fabric_PinningTrustManager = Java.use('io.fabric.sdk.android.services.network.PinningTrustManager');
			fabric_PinningTrustManager.checkServerTrusted.implementation = function(chain, authType) {
				console.log('[+] Bypassing Fabric PinningTrustManager');
				return;
			};
		} catch (err) {
			console.log('[-] Fabric PinningTrustManager pinner not found');
			//console.log(err);
		}




		// OpenSSLSocketImpl Conscrypt (double bypass) //
		/////////////////////////////////////////////////
		try {
			var OpenSSLSocketImpl = Java.use('com.android.org.conscrypt.OpenSSLSocketImpl');
			OpenSSLSocketImpl.verifyCertificateChain.implementation = function(certRefs, JavaObject, authMethod) {
				console.log('[+] Bypassing OpenSSLSocketImpl Conscrypt {1}');
			};
		} catch (err) {
			console.log('[-] OpenSSLSocketImpl Conscrypt {1} pinner not found');
			//console.log(err);        
		}
		try {
			var OpenSSLSocketImpl = Java.use('com.android.org.conscrypt.OpenSSLSocketImpl');
			OpenSSLSocketImpl.verifyCertificateChain.implementation = function(certChain, authMethod) {
				console.log('[+] Bypassing OpenSSLSocketImpl Conscrypt {2}');
			};
		} catch (err) {
			console.log('[-] OpenSSLSocketImpl Conscrypt {2} pinner not found');
			//console.log(err);        
		}




		// OpenSSLEngineSocketImpl Conscrypt //
		///////////////////////////////////////
		try {
			var OpenSSLEngineSocketImpl_Activity = Java.use('com.android.org.conscrypt.OpenSSLEngineSocketImpl');
			OpenSSLEngineSocketImpl_Activity.verifyCertificateChain.overload('[Ljava.lang.Long;', 'java.lang.String').implementation = function(a, b) {
				console.log('[+] Bypassing OpenSSLEngineSocketImpl Conscrypt: ' + b);
			};
		} catch (err) {
			console.log('[-] OpenSSLEngineSocketImpl Conscrypt pinner not found');
			//console.log(err);
		}




		// OpenSSLSocketImpl Apache Harmony //
		//////////////////////////////////////
		try {
			var OpenSSLSocketImpl_Harmony = Java.use('org.apache.harmony.xnet.provider.jsse.OpenSSLSocketImpl');
			OpenSSLSocketImpl_Harmony.verifyCertificateChain.implementation = function(asn1DerEncodedCertificateChain, authMethod) {
				console.log('[+] Bypassing OpenSSLSocketImpl Apache Harmony');
			};
		} catch (err) {
			console.log('[-] OpenSSLSocketImpl Apache Harmony pinner not found');
			//console.log(err);      
		}




		// PhoneGap sslCertificateChecker //
		////////////////////////////////////
		try {
			var phonegap_Activity = Java.use('nl.xservices.plugins.sslCertificateChecker');
			phonegap_Activity.execute.overload('java.lang.String', 'org.json.JSONArray', 'org.apache.cordova.CallbackContext').implementation = function(a, b, c) {
				console.log('[+] Bypassing PhoneGap sslCertificateChecker: ' + a);
				return true;
			};
		} catch (err) {
			console.log('[-] PhoneGap sslCertificateChecker pinner not found');
			//console.log(err);
		}




		// IBM MobileFirst pinTrustedCertificatePublicKey (double bypass) //
		////////////////////////////////////////////////////////////////////
		try {
			// Bypass IBM MobileFirst {1}
			var WLClient_Activity_1 = Java.use('com.worklight.wlclient.api.WLClient');
			WLClient_Activity_1.getInstance().pinTrustedCertificatePublicKey.overload('java.lang.String').implementation = function(cert) {
				console.log('[+] Bypassing IBM MobileFirst pinTrustedCertificatePublicKey {1}: ' + cert);
				return;
			};
			} catch (err) {
			console.log('[-] IBM MobileFirst pinTrustedCertificatePublicKey {1} pinner not found');
			//console.log(err);
		}
		try {
			// Bypass IBM MobileFirst {2}
			var WLClient_Activity_2 = Java.use('com.worklight.wlclient.api.WLClient');
			WLClient_Activity_2.getInstance().pinTrustedCertificatePublicKey.overload('[Ljava.lang.String;').implementation = function(cert) {
				console.log('[+] Bypassing IBM MobileFirst pinTrustedCertificatePublicKey {2}: ' + cert);
				return;
			};
		} catch (err) {
			console.log('[-] IBM MobileFirst pinTrustedCertificatePublicKey {2} pinner not found');
			//console.log(err);
		}




		// IBM WorkLight (ancestor of MobileFirst) HostNameVerifierWithCertificatePinning (quadruple bypass) //
		///////////////////////////////////////////////////////////////////////////////////////////////////////
		try {
			// Bypass IBM WorkLight {1}
			var worklight_Activity_1 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
			worklight_Activity_1.verify.overload('java.lang.String', 'javax.net.ssl.SSLSocket').implementation = function(a, b) {
				console.log('[+] Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning {1}: ' + a);                
				return;
			};
		} catch (err) {
			console.log('[-] IBM WorkLight HostNameVerifierWithCertificatePinning {1} pinner not found');
			//console.log(err);
		}
		try {
			// Bypass IBM WorkLight {2}
			var worklight_Activity_2 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
			worklight_Activity_2.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function(a, b) {
				console.log('[+] Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning {2}: ' + a);
				return;
			};
		} catch (err) {
			console.log('[-] IBM WorkLight HostNameVerifierWithCertificatePinning {2} pinner not found');
			//console.log(err);
		}
		try {
			// Bypass IBM WorkLight {3}
			var worklight_Activity_3 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
			worklight_Activity_3.verify.overload('java.lang.String', '[Ljava.lang.String;', '[Ljava.lang.String;').implementation = function(a, b) {
				console.log('[+] Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning {3}: ' + a);
				return;
			};
		} catch (err) {
			console.log('[-] IBM WorkLight HostNameVerifierWithCertificatePinning {3} pinner not found');
			//console.log(err);
		}
		try {
			// Bypass IBM WorkLight {4}
			var worklight_Activity_4 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
			worklight_Activity_4.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function(a, b) {
				console.log('[+] Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning {4}: ' + a);
				return true;
			};
		} catch (err) {
			console.log('[-] IBM WorkLight HostNameVerifierWithCertificatePinning {4} pinner not found');
			//console.log(err);
		}




		// Conscrypt CertPinManager //
		//////////////////////////////
		try {
			var conscrypt_CertPinManager_Activity = Java.use('com.android.org.conscrypt.CertPinManager');
			conscrypt_CertPinManager_Activity.checkChainPinning.overload('java.lang.String', 'java.util.List').implementation = function(a, b) {
				console.log('[+] Bypassing Conscrypt CertPinManager: ' + a);
				//return;
				return true;
			};
		} catch (err) {
			console.log('[-] Conscrypt CertPinManager pinner not found');
			//console.log(err);
		}
		
		


		// Conscrypt CertPinManager (Legacy) //
		///////////////////////////////////////
		try {
			var legacy_conscrypt_CertPinManager_Activity = Java.use('com.android.org.conscrypt.CertPinManager');
			legacy_conscrypt_CertPinManager_Activity.isChainValid.overload('java.lang.String', 'java.util.List').implementation = function(a, b) {
				console.log('[+] Bypassing Conscrypt CertPinManager (Legacy): ' + a);
				return true;
			};
		} catch (err) {
			console.log('[-] Conscrypt CertPinManager (Legacy) pinner not found');
			//console.log(err);
		}

			   


		// CWAC-Netsecurity (unofficial back-port pinner for Android<4.2) CertPinManager //
		///////////////////////////////////////////////////////////////////////////////////
		try {
			var cwac_CertPinManager_Activity = Java.use('com.commonsware.cwac.netsecurity.conscrypt.CertPinManager');
			cwac_CertPinManager_Activity.isChainValid.overload('java.lang.String', 'java.util.List').implementation = function(a, b) {
				console.log('[+] Bypassing CWAC-Netsecurity CertPinManager: ' + a);
				return true;
			};
		} catch (err) {
			console.log('[-] CWAC-Netsecurity CertPinManager pinner not found');
			//console.log(err);
		}




		// Worklight Androidgap WLCertificatePinningPlugin //
		/////////////////////////////////////////////////////
		try {
			var androidgap_WLCertificatePinningPlugin_Activity = Java.use('com.worklight.androidgap.plugin.WLCertificatePinningPlugin');
			androidgap_WLCertificatePinningPlugin_Activity.execute.overload('java.lang.String', 'org.json.JSONArray', 'org.apache.cordova.CallbackContext').implementation = function(a, b, c) {
				console.log('[+] Bypassing Worklight Androidgap WLCertificatePinningPlugin: ' + a);
				return true;
			};
		} catch (err) {
			console.log('[-] Worklight Androidgap WLCertificatePinningPlugin pinner not found');
			//console.log(err);
		}




		// Netty FingerprintTrustManagerFactory //
		//////////////////////////////////////////
		try {
			var netty_FingerprintTrustManagerFactory = Java.use('io.netty.handler.ssl.util.FingerprintTrustManagerFactory');
			//NOTE: sometimes this below implementation could be useful 
			//var netty_FingerprintTrustManagerFactory = Java.use('org.jboss.netty.handler.ssl.util.FingerprintTrustManagerFactory');
			netty_FingerprintTrustManagerFactory.checkTrusted.implementation = function(type, chain) {
				console.log('[+] Bypassing Netty FingerprintTrustManagerFactory');
			};
		} catch (err) {
			console.log('[-] Netty FingerprintTrustManagerFactory pinner not found');
			//console.log(err);
		}




		// Squareup CertificatePinner [OkHTTP<v3] (double bypass) //
		////////////////////////////////////////////////////////////
		try {
			// Bypass Squareup CertificatePinner  {1}
			var Squareup_CertificatePinner_Activity_1 = Java.use('com.squareup.okhttp.CertificatePinner');
			Squareup_CertificatePinner_Activity_1.check.overload('java.lang.String', 'java.security.cert.Certificate').implementation = function(a, b) {
				console.log('[+] Bypassing Squareup CertificatePinner {1}: ' + a);
				return;
			};
		} catch (err) {
			console.log('[-] Squareup CertificatePinner {1} pinner not found');
			//console.log(err);
		}
		try {
			// Bypass Squareup CertificatePinner {2}
			var Squareup_CertificatePinner_Activity_2 = Java.use('com.squareup.okhttp.CertificatePinner');
			Squareup_CertificatePinner_Activity_2.check.overload('java.lang.String', 'java.util.List').implementation = function(a, b) {
				console.log('[+] Bypassing Squareup CertificatePinner {2}: ' + a);
				return;
			};
		} catch (err) {
			console.log('[-] Squareup CertificatePinner {2} pinner not found');
			//console.log(err);
		}




		// Squareup OkHostnameVerifier [OkHTTP v3] (double bypass) //
		/////////////////////////////////////////////////////////////
		try {
			// Bypass Squareup OkHostnameVerifier {1}
			var Squareup_OkHostnameVerifier_Activity_1 = Java.use('com.squareup.okhttp.internal.tls.OkHostnameVerifier');
			Squareup_OkHostnameVerifier_Activity_1.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function(a, b) {
				console.log('[+] Bypassing Squareup OkHostnameVerifier {1}: ' + a);
				return true;
			};
		} catch (err) {
			console.log('[-] Squareup OkHostnameVerifier check not found');
			//console.log(err);
		}    
		try {
			// Bypass Squareup OkHostnameVerifier {2}
			var Squareup_OkHostnameVerifier_Activity_2 = Java.use('com.squareup.okhttp.internal.tls.OkHostnameVerifier');
			Squareup_OkHostnameVerifier_Activity_2.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function(a, b) {
				console.log('[+] Bypassing Squareup OkHostnameVerifier {2}: ' + a);
				return true;
			};
		} catch (err) {
			console.log('[-] Squareup OkHostnameVerifier check not found');
			//console.log(err);
		}


		

		// Android WebViewClient (quadruple bypass) //
		//////////////////////////////////////////////
		try {
			// Bypass WebViewClient {1} (deprecated from Android 6)
			var AndroidWebViewClient_Activity_1 = Java.use('android.webkit.WebViewClient');
			AndroidWebViewClient_Activity_1.onReceivedSslError.overload('android.webkit.WebView', 'android.webkit.SslErrorHandler', 'android.net.http.SslError').implementation = function(obj1, obj2, obj3) {
				console.log('[+] Bypassing Android WebViewClient check {1}');
			};
		} catch (err) {
			console.log('[-] Android WebViewClient {1} check not found');
			//console.log(err)
		}
		try {
			// Bypass WebViewClient {2}
			var AndroidWebViewClient_Activity_2 = Java.use('android.webkit.WebViewClient');
			AndroidWebViewClient_Activity_2.onReceivedSslError.overload('android.webkit.WebView', 'android.webkit.WebResourceRequest', 'android.webkit.WebResourceError').implementation = function(obj1, obj2, obj3) {
				console.log('[+] Bypassing Android WebViewClient check {2}');
			};
		} catch (err) {
			console.log('[-] Android WebViewClient {2} check not found');
			//console.log(err)
		}
		try {
			// Bypass WebViewClient {3}
			var AndroidWebViewClient_Activity_3 = Java.use('android.webkit.WebViewClient');
			AndroidWebViewClient_Activity_3.onReceivedError.overload('android.webkit.WebView', 'int', 'java.lang.String', 'java.lang.String').implementation = function(obj1, obj2, obj3, obj4) {
				console.log('[+] Bypassing Android WebViewClient check {3}');
			};
		} catch (err) {
			console.log('[-] Android WebViewClient {3} check not found');
			//console.log(err)
		}
		try {
			// Bypass WebViewClient {4}
			var AndroidWebViewClient_Activity_4 = Java.use('android.webkit.WebViewClient');
			AndroidWebViewClient_Activity_4.onReceivedError.overload('android.webkit.WebView', 'android.webkit.WebResourceRequest', 'android.webkit.WebResourceError').implementation = function(obj1, obj2, obj3) {
				console.log('[+] Bypassing Android WebViewClient check {4}');
			};
		} catch (err) {
			console.log('[-] Android WebViewClient {4} check not found');
			//console.log(err)
		}
		



		// Apache Cordova WebViewClient //
		//////////////////////////////////
		try {
			var CordovaWebViewClient_Activity = Java.use('org.apache.cordova.CordovaWebViewClient');
			CordovaWebViewClient_Activity.onReceivedSslError.overload('android.webkit.WebView', 'android.webkit.SslErrorHandler', 'android.net.http.SslError').implementation = function(obj1, obj2, obj3) {
				console.log('[+] Bypassing Apache Cordova WebViewClient check');
				obj3.proceed();
			};
		} catch (err) {
			console.log('[-] Apache Cordova WebViewClient check not found');
			//console.log(err);
		}




		// Boye AbstractVerifier //
		///////////////////////////
		try {
			var boye_AbstractVerifier = Java.use('ch.boye.httpclientandroidlib.conn.ssl.AbstractVerifier');
			boye_AbstractVerifier.verify.implementation = function(host, ssl) {
				console.log('[+] Bypassing Boye AbstractVerifier check: ' + host);
			};
		} catch (err) {
			console.log('[-] Boye AbstractVerifier check not found');
			//console.log(err);
		}




		// Apache AbstractVerifier //
		/////////////////////////////
		try {
			var apache_AbstractVerifier = Java.use('org.apache.http.conn.ssl.AbstractVerifier');
			apache_AbstractVerifier.verify.implementation = function(a, b, c, d) {
				console.log('[+] Bypassing Apache AbstractVerifier check: ' + a);
				return;
			};
		} catch (err) {
			console.log('[-] Apache AbstractVerifier check not found');
			//console.log(err);
		}




		// Chromium Cronet //
		/////////////////////    
		try {
			var CronetEngineBuilderImpl_Activity = Java.use("org.chromium.net.impl.CronetEngineBuilderImpl");
			// Setting argument to TRUE (default is TRUE) to disable Public Key pinning for local trust anchors
			CronetEngine_Activity.enablePublicKeyPinningBypassForLocalTrustAnchors.overload('boolean').implementation = function(a) {
				console.log("[+] Disabling Public Key pinning for local trust anchors in Chromium Cronet");
				var cronet_obj_1 = CronetEngine_Activity.enablePublicKeyPinningBypassForLocalTrustAnchors.call(this, true);
				return cronet_obj_1;
			};
			// Bypassing Chromium Cronet pinner
			CronetEngine_Activity.addPublicKeyPins.overload('java.lang.String', 'java.util.Set', 'boolean', 'java.util.Date').implementation = function(hostName, pinsSha256, includeSubdomains, expirationDate) {
				console.log("[+] Bypassing Chromium Cronet pinner: " + hostName);
				var cronet_obj_2 = CronetEngine_Activity.addPublicKeyPins.call(this, hostName, pinsSha256, includeSubdomains, expirationDate);
				return cronet_obj_2;
			};
		} catch (err) {
			console.log('[-] Chromium Cronet pinner not found')
			//console.log(err);
		}



		// Flutter Pinning packages http_certificate_pinning and ssl_pinning_plugin (double bypass) //
		//////////////////////////////////////////////////////////////////////////////////////////////
		try {
			// Bypass HttpCertificatePinning.check {1}
			var HttpCertificatePinning_Activity = Java.use('diefferson.http_certificate_pinning.HttpCertificatePinning');
			HttpCertificatePinning_Activity.checkConnexion.overload("java.lang.String", "java.util.List", "java.util.Map", "int", "java.lang.String").implementation = function (a, b, c ,d, e) {
				console.log('[+] Bypassing Flutter HttpCertificatePinning : ' + a);
				return true;
			};
		} catch (err) {
			console.log('[-] Flutter HttpCertificatePinning pinner not found');
			//console.log(err);
		}
		try {
			// Bypass SslPinningPlugin.check {2}
			var SslPinningPlugin_Activity = Java.use('com.macif.plugin.sslpinningplugin.SslPinningPlugin');
			SslPinningPlugin_Activity.checkConnexion.overload("java.lang.String", "java.util.List", "java.util.Map", "int", "java.lang.String").implementation = function (a, b, c ,d, e) {
				console.log('[+] Bypassing Flutter SslPinningPlugin: ' + a);
				return true;
			};
		} catch (err) {
			console.log('[-] Flutter SslPinningPlugin pinner not found');
			//console.log(err);
		}



		
		// Dynamic SSLPeerUnverifiedException Patcher                                //
		// An useful technique to bypass SSLPeerUnverifiedException failures raising //
		// when the Android app uses some uncommon SSL Pinning methods or an heavily //
		// code obfuscation. Inspired by an idea of: https://github.com/httptoolkit  //
		///////////////////////////////////////////////////////////////////////////////
		function rudimentaryFix(typeName) {
			// This is a improvable rudimentary fix, if not works you can patch it manually
			if (typeName === undefined){
				return;
			} else if (typeName === 'boolean') {
				return true;
			} else {
				return null;
			}
		}
		try {
			var UnverifiedCertError = Java.use('javax.net.ssl.SSLPeerUnverifiedException');
			UnverifiedCertError.$init.implementation = function (str) {
				console.log('\x1b[36m[!] Unexpected SSLPeerUnverifiedException occurred, trying to patch it dynamically...\x1b[0m');
				try {
					var stackTrace = Java.use('java.lang.Thread').currentThread().getStackTrace();
					var exceptionStackIndex = stackTrace.findIndex(stack =>
						stack.getClassName() === "javax.net.ssl.SSLPeerUnverifiedException"
					);
					// Retrieve the method raising the SSLPeerUnverifiedException
					var callingFunctionStack = stackTrace[exceptionStackIndex + 1];
					var className = callingFunctionStack.getClassName();
					var methodName = callingFunctionStack.getMethodName();
					var callingClass = Java.use(className);
					var callingMethod = callingClass[methodName];
					console.log('\x1b[36m[!] Attempting to bypass uncommon SSL Pinning method on: '+className+'.'+methodName+'\x1b[0m');					
					// Skip it when already patched by Frida
					if (callingMethod.implementation) {
						return; 
					}
					// Trying to patch the uncommon SSL Pinning method via implementation
					var returnTypeName = callingMethod.returnType.type;
					callingMethod.implementation = function() {
						rudimentaryFix(returnTypeName);
					};
				} catch (e) {
					// Dynamic patching via implementation does not works, then trying via function overloading
					//console.log('[!] The uncommon SSL Pinning method has more than one overload); 
					if (String(e).includes(".overload")) {
						var splittedList = String(e).split(".overload");
						for (let i=2; i<splittedList.length; i++) {
							var extractedOverload = splittedList[i].trim().split("(")[1].slice(0,-1).replaceAll("'","");
							// Check if extractedOverload has multiple arguments
							if (extractedOverload.includes(",")) {
								// Go here if overloaded method has multiple arguments (NOTE: max 6 args are covered here)
								var argList = extractedOverload.split(", ");
								console.log('\x1b[36m[!] Attempting overload of '+className+'.'+methodName+' with arguments: '+extractedOverload+'\x1b[0m');
								if (argList.length == 2) {
									callingMethod.overload(argList[0], argList[1]).implementation = function(a,b) {
										rudimentaryFix(returnTypeName);
									}
								} else if (argNum == 3) {
									callingMethod.overload(argList[0], argList[1], argList[2]).implementation = function(a,b,c) {
										rudimentaryFix(returnTypeName);
									}
								}  else if (argNum == 4) {
									callingMethod.overload(argList[0], argList[1], argList[2], argList[3]).implementation = function(a,b,c,d) {
										rudimentaryFix(returnTypeName);
									}
								}  else if (argNum == 5) {
									callingMethod.overload(argList[0], argList[1], argList[2], argList[3], argList[4]).implementation = function(a,b,c,d,e) {
										rudimentaryFix(returnTypeName);
									}
								}  else if (argNum == 6) {
									callingMethod.overload(argList[0], argList[1], argList[2], argList[3], argList[4], argList[5]).implementation = function(a,b,c,d,e,f) {
										rudimentaryFix(returnTypeName);
									}
								} 
							// Go here if overloaded method has a single argument
							} else {
								callingMethod.overload(extractedOverload).implementation = function(a) {
									rudimentaryFix(returnTypeName);
								}
							}
						}
					} else {
						console.log('\x1b[36m[-] Failed to dynamically patch SSLPeerUnverifiedException '+e+'\x1b[0m');
					}
				}
				//console.log('\x1b[36m[+] SSLPeerUnverifiedException hooked\x1b[0m');
				return this.$init(str);
			};
		} catch (err) {
		}
		


	 
	});
	
}, 0);
(function () {
    Java.perform(function() {
        console.log("");
        console.log("[.] Cert Pinning Bypass/Re-Pinning");
        
        var URL = Java.use('java.net.URL');
        var InputStreamReader = Java.use('java.io.InputStreamReader');
	    var CertificateFactory = Java.use("java.security.cert.CertificateFactory");
	    var FileInputStream = Java.use("java.io.FileInputStream");
	    var BufferedInputStream = Java.use("java.io.BufferedInputStream");
	    var X509Certificate = Java.use("java.security.cert.X509Certificate");
	    var KeyStore = Java.use("java.security.KeyStore");
	    var TrustManagerFactory = Java.use("javax.net.ssl.TrustManagerFactory");
	    var SSLContext = Java.use("javax.net.ssl.SSLContext");

	    // Load CAs from an InputStream
	    console.log("[+] Loading our CA...")
	    var cf = CertificateFactory.getInstance("X.509");
	    
	    try {
            //this assumes you've already got the system proxy set to use Fiddler
            var fiddlerUrl = URL.$new("http://ipv4.fiddler:8888/FiddlerRoot.cer");
            var connection = fiddlerUrl.openConnection();
        
	    }
	    catch(err) {
	    	console.log("[o] " + err);
	    }
	    
	    var bufferedInputStream = BufferedInputStream.$new(connection.getInputStream());
	  	var ca = cf.generateCertificate(bufferedInputStream);
	    bufferedInputStream.close();

		var certInfo = Java.cast(ca, X509Certificate);
	    console.log("[o] Our CA Info: " + certInfo.getSubjectDN());

	    // Create a KeyStore containing our trusted CAs
	    console.log("[+] Creating a KeyStore for our CA...");
	    var keyStoreType = KeyStore.getDefaultType();
	    var keyStore = KeyStore.getInstance(keyStoreType);
	    keyStore.load(null, null);
	    keyStore.setCertificateEntry("ca", ca);
	    
	    // Create a TrustManager that trusts the CAs in our KeyStore
	    console.log("[+] Creating a TrustManager that trusts the CA in our KeyStore...");
	    var tmfAlgorithm = TrustManagerFactory.getDefaultAlgorithm();
	    var tmf = TrustManagerFactory.getInstance(tmfAlgorithm);
	    tmf.init(keyStore);
	    console.log("[+] Our TrustManager is ready...");

	    console.log("[+] Hijacking SSLContext methods now...")
	    console.log("[-] Waiting for the app to invoke SSLContext.init()...")

	   	SSLContext.init.overload("[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom").implementation = function(a,b,c) {
	   		console.log("[o] App invoked javax.net.ssl.SSLContext.init...");
	   		SSLContext.init.overload("[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom").call(this, a, tmf.getTrustManagers(), c);
	   		console.log("[+] SSLContext initialized with our custom TrustManager!");
           

           }
        })})();
        setTimeout(function(){
            Java.perform(function (){
                console.log("");
                console.log("[.] Cert Pinning Bypass/Re-Pinning");
        
                var CertificateFactory = Java.use("java.security.cert.CertificateFactory");
                var FileInputStream = Java.use("java.io.FileInputStream");
                var BufferedInputStream = Java.use("java.io.BufferedInputStream");
                var X509Certificate = Java.use("java.security.cert.X509Certificate");
                var KeyStore = Java.use("java.security.KeyStore");
                var TrustManagerFactory = Java.use("javax.net.ssl.TrustManagerFactory");
                var SSLContext = Java.use("javax.net.ssl.SSLContext");
        
                // Load CAs from an InputStream
                console.log("[+] Loading our CA...")
                var cf = CertificateFactory.getInstance("X.509");
                
                try {
                    var fileInputStream = FileInputStream.$new("/data/local/tmp/cert-der.crt");
                }
                catch(err) {
                    console.log("[o] " + err);
                }
                
                var bufferedInputStream = BufferedInputStream.$new(fileInputStream);
                  var ca = cf.generateCertificate(bufferedInputStream);
                bufferedInputStream.close();
        
                var certInfo = Java.cast(ca, X509Certificate);
                console.log("[o] Our CA Info: " + certInfo.getSubjectDN());
        
                // Create a KeyStore containing our trusted CAs
                console.log("[+] Creating a KeyStore for our CA...");
                var keyStoreType = KeyStore.getDefaultType();
                var keyStore = KeyStore.getInstance(keyStoreType);
                keyStore.load(null, null);
                keyStore.setCertificateEntry("ca", ca);
                
                // Create a TrustManager that trusts the CAs in our KeyStore
                console.log("[+] Creating a TrustManager that trusts the CA in our KeyStore...");
                var tmfAlgorithm = TrustManagerFactory.getDefaultAlgorithm();
                var tmf = TrustManagerFactory.getInstance(tmfAlgorithm);
                tmf.init(keyStore);
                console.log("[+] Our TrustManager is ready...");
        
                console.log("[+] Hijacking SSLContext methods now...")
                console.log("[-] Waiting for the app to invoke SSLContext.init()...")
        
                   SSLContext.init.overload("[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom").implementation = function(a,b,c) {
                       console.log("[o] App invoked javax.net.ssl.SSLContext.init...");
                       SSLContext.init.overload("[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom").call(this, a, tmf.getTrustManagers(), c);
                       console.log("[+] SSLContext initialized with our custom TrustManager!");
                   }
            });
        },0);

        Java.perform(function() {
            var array_list = Java.use("java.util.ArrayList");
            var ApiClient = Java.use('com.android.org.conscrypt.TrustManagerImpl');
            ApiClient.checkTrustedRecursive.implementation = function(a1, a2, a3, a4, a5, a6) {
                var k = array_list.$new();
                return k;
            }
        
        }, 0);
        Java.perform(function () {
            var CertificatePinner = Java.use("okhttp3.CertificatePinner");
            CertificatePinner.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function(p0, p1){
                console.log("Called! [Certificate]");
                return;
            };
            CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function(p0, p1){
                console.log("Called! [List]");
                return;
            };
        });
        Java.perform(function() {
            var TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');
            var ArrayList = Java.use("java.util.ArrayList");
            TrustManagerImpl.verifyChain.implementation = function(untrustedChain, trustAnchorChain,
                host, clientAuth, ocspData, tlsSctData) {
                console.log("[+] Bypassing TrustManagerImpl->verifyChain()");
                return untrustedChain;
            }
            TrustManagerImpl.checkTrustedRecursive.implementation = function(certs, host, clientAuth, untrustedChain,
                trustAnchorChain, used) {
                console.log("[+] Bypassing TrustManagerImpl->checkTrustedRecursive()");
                return ArrayList.$new();
            };
        });
        setTimeout(function () {
            Java.perform(function () {
                console.log("---");
                console.log("Unpinning Android app...");
                try {
                    const UnverifiedCertError = Java.use('javax.net.ssl.SSLPeerUnverifiedException');
                    UnverifiedCertError.$init.implementation = function (str) {
                        console.log('  --> Unexpected SSL verification failure, adding dynamic patch...');
        
                        try {
                            const stackTrace = Java.use('java.lang.Thread').currentThread().getStackTrace();
                            const exceptionStackIndex = stackTrace.findIndex(stack =>
                                stack.getClassName() === "javax.net.ssl.SSLPeerUnverifiedException"
                            );
                            const callingFunctionStack = stackTrace[exceptionStackIndex + 1];
        
                            const className = callingFunctionStack.getClassName();
                            const methodName = callingFunctionStack.getMethodName();
        
                            console.log(`      Thrown by ${className}->${methodName}`);
        
                            const callingClass = Java.use(className);
                            const callingMethod = callingClass[methodName];
        
                            if (callingMethod.implementation) return; // Already patched by Frida - skip it
        
                            console.log('      Attempting to patch automatically...');
                            const returnTypeName = callingMethod.returnType.type;
        
                            callingMethod.implementation = function () {
                                console.log(`  --> Bypassing ${className}->${methodName} (automatic exception patch)`);
        
                                // This is not a perfect fix! Most unknown cases like this are really just
                                // checkCert(cert) methods though, so doing nothing is perfect, and if we
                                // do need an actual return value then this is probably the best we can do,
                                // and at least we're logging the method name so you can patch it manually:
        
                                if (returnTypeName === 'void') {
                                    return;
                                } else {
                                    return null;
                                }
                            };
        
                            console.log(`      [+] ${className}->${methodName} (automatic exception patch)`);
                        } catch (e) {
                            console.log('      [ ] Failed to automatically patch failure');
                        }
        
                        return this.$init(str);
                    };
                    console.log('[+] SSLPeerUnverifiedException auto-patcher');
                } catch (err) {
                    console.log('[ ] SSLPeerUnverifiedException auto-patcher');
                }
        
                /// -- Specific targeted hooks: -- ///
        
                // HttpsURLConnection
                try {
                    const HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
                    HttpsURLConnection.setDefaultHostnameVerifier.implementation = function (hostnameVerifier) {
                        console.log('  --> Bypassing HttpsURLConnection (setDefaultHostnameVerifier)');
                        return; // Do nothing, i.e. don't change the hostname verifier
                    };
                    console.log('[+] HttpsURLConnection (setDefaultHostnameVerifier)');
                } catch (err) {
                    console.log('[ ] HttpsURLConnection (setDefaultHostnameVerifier)');
                }
                try {
                    const HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
                    HttpsURLConnection.setSSLSocketFactory.implementation = function (SSLSocketFactory) {
                        console.log('  --> Bypassing HttpsURLConnection (setSSLSocketFactory)');
                        return; // Do nothing, i.e. don't change the SSL socket factory
                    };
                    console.log('[+] HttpsURLConnection (setSSLSocketFactory)');
                } catch (err) {
                    console.log('[ ] HttpsURLConnection (setSSLSocketFactory)');
                }
                try {
                    const HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
                    HttpsURLConnection.setHostnameVerifier.implementation = function (hostnameVerifier) {
                        console.log('  --> Bypassing HttpsURLConnection (setHostnameVerifier)');
                        return; // Do nothing, i.e. don't change the hostname verifier
                    };
                    console.log('[+] HttpsURLConnection (setHostnameVerifier)');
                } catch (err) {
                    console.log('[ ] HttpsURLConnection (setHostnameVerifier)');
                }
        
                // SSLContext
                try {
                    const X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
                    const SSLContext = Java.use('javax.net.ssl.SSLContext');
        
                    const TrustManager = Java.registerClass({
                        // Implement a custom TrustManager
                        name: 'dev.asd.test.TrustManager',
                        implements: [X509TrustManager],
                        methods: {
                            checkClientTrusted: function (chain, authType) { },
                            checkServerTrusted: function (chain, authType) { },
                            getAcceptedIssuers: function () { return []; }
                        }
                    });
        
                    // Prepare the TrustManager array to pass to SSLContext.init()
                    const TrustManagers = [TrustManager.$new()];
        
                    // Get a handle on the init() on the SSLContext class
                    const SSLContext_init = SSLContext.init.overload(
                        '[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom'
                    );
        
                    // Override the init method, specifying the custom TrustManager
                    SSLContext_init.implementation = function (keyManager, trustManager, secureRandom) {
                        console.log('  --> Bypassing Trustmanager (Android < 7) request');
                        SSLContext_init.call(this, keyManager, TrustManagers, secureRandom);
                    };
                    console.log('[+] SSLContext');
                } catch (err) {
                    console.log('[ ] SSLContext');
                }
        
                // TrustManagerImpl (Android > 7)
                try {
                    const array_list = Java.use("java.util.ArrayList");
                    const TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');
        
                    // This step is notably what defeats the most common case: network security config
                    TrustManagerImpl.checkTrustedRecursive.implementation = function(a1, a2, a3, a4, a5, a6) {
                        console.log('  --> Bypassing TrustManagerImpl checkTrusted ');
                        return array_list.$new();
                    }
        
                    TrustManagerImpl.verifyChain.implementation = function (untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
                        console.log('  --> Bypassing TrustManagerImpl verifyChain: ' + host);
                        return untrustedChain;
                    };
                    console.log('[+] TrustManagerImpl');
                } catch (err) {
                    console.log('[ ] TrustManagerImpl');
                }
        
                // OkHTTPv3 (quadruple bypass)
                try {
                    // Bypass OkHTTPv3 {1}
                    const okhttp3_Activity_1 = Java.use('okhttp3.CertificatePinner');
                    okhttp3_Activity_1.check.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                        console.log('  --> Bypassing OkHTTPv3 (list): ' + a);
                        return;
                    };
                    console.log('[+] OkHTTPv3 (list)');
                } catch (err) {
                    console.log('[ ] OkHTTPv3 (list)');
                }
                try {
                    // Bypass OkHTTPv3 {2}
                    // This method of CertificatePinner.check could be found in some old Android app
                    const okhttp3_Activity_2 = Java.use('okhttp3.CertificatePinner');
                    okhttp3_Activity_2.check.overload('java.lang.String', 'java.security.cert.Certificate').implementation = function (a, b) {
                        console.log('  --> Bypassing OkHTTPv3 (cert): ' + a);
                        return;
                    };
                    console.log('[+] OkHTTPv3 (cert)');
                } catch (err) {
                    console.log('[ ] OkHTTPv3 (cert)');
                }
                try {
                    // Bypass OkHTTPv3 {3}
                    const okhttp3_Activity_3 = Java.use('okhttp3.CertificatePinner');
                    okhttp3_Activity_3.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function (a, b) {
                        console.log('  --> Bypassing OkHTTPv3 (cert array): ' + a);
                        return;
                    };
                    console.log('[+] OkHTTPv3 (cert array)');
                } catch (err) {
                    console.log('[ ] OkHTTPv3 (cert array)');
                }
                try {
                    // Bypass OkHTTPv3 {4}
                    const okhttp3_Activity_4 = Java.use('okhttp3.CertificatePinner');
                    okhttp3_Activity_4['check$okhttp'].implementation = function (a, b) {
                        console.log('  --> Bypassing OkHTTPv3 ($okhttp): ' + a);
                        return;
                    };
                    console.log('[+] OkHTTPv3 ($okhttp)');
                } catch (err) {
                    console.log('[ ] OkHTTPv3 ($okhttp)');
                }
        
                // Trustkit (triple bypass)
                try {
                    // Bypass Trustkit {1}
                    const trustkit_Activity_1 = Java.use('com.datatheorem.android.trustkit.pinning.OkHostnameVerifier');
                    trustkit_Activity_1.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (a, b) {
                        console.log('  --> Bypassing Trustkit OkHostnameVerifier(SSLSession): ' + a);
                        return true;
                    };
                    console.log('[+] Trustkit OkHostnameVerifier(SSLSession)');
                } catch (err) {
                    console.log('[ ] Trustkit OkHostnameVerifier(SSLSession)');
                }
                try {
                    // Bypass Trustkit {2}
                    const trustkit_Activity_2 = Java.use('com.datatheorem.android.trustkit.pinning.OkHostnameVerifier');
                    trustkit_Activity_2.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (a, b) {
                        console.log('  --> Bypassing Trustkit OkHostnameVerifier(cert): ' + a);
                        return true;
                    };
                    console.log('[+] Trustkit OkHostnameVerifier(cert)');
                } catch (err) {
                    console.log('[ ] Trustkit OkHostnameVerifier(cert)');
                }
                try {
                    // Bypass Trustkit {3}
                    const trustkit_PinningTrustManager = Java.use('com.datatheorem.android.trustkit.pinning.PinningTrustManager');
                    trustkit_PinningTrustManager.checkServerTrusted.implementation = function () {
                        console.log('  --> Bypassing Trustkit PinningTrustManager');
                    };
                    console.log('[+] Trustkit PinningTrustManager');
                } catch (err) {
                    console.log('[ ] Trustkit PinningTrustManager');
                }
        
                // Appcelerator Titanium
                try {
                    const appcelerator_PinningTrustManager = Java.use('appcelerator.https.PinningTrustManager');
                    appcelerator_PinningTrustManager.checkServerTrusted.implementation = function () {
                        console.log('  --> Bypassing Appcelerator PinningTrustManager');
                    };
                    console.log('[+] Appcelerator PinningTrustManager');
                } catch (err) {
                    console.log('[ ] Appcelerator PinningTrustManager');
                }
        
                // OpenSSLSocketImpl Conscrypt
                try {
                    const OpenSSLSocketImpl = Java.use('com.android.org.conscrypt.OpenSSLSocketImpl');
                    OpenSSLSocketImpl.verifyCertificateChain.implementation = function (certRefs, JavaObject, authMethod) {
                        console.log('  --> Bypassing OpenSSLSocketImpl Conscrypt');
                    };
                    console.log('[+] OpenSSLSocketImpl Conscrypt');
                } catch (err) {
                    console.log('[ ] OpenSSLSocketImpl Conscrypt');
                }
        
                // OpenSSLEngineSocketImpl Conscrypt
                try {
                    const OpenSSLEngineSocketImpl_Activity = Java.use('com.android.org.conscrypt.OpenSSLEngineSocketImpl');
                    OpenSSLEngineSocketImpl_Activity.verifyCertificateChain.overload('[Ljava.lang.Long;', 'java.lang.String').implementation = function (a, b) {
                        console.log('  --> Bypassing OpenSSLEngineSocketImpl Conscrypt: ' + b);
                    };
                    console.log('[+] OpenSSLEngineSocketImpl Conscrypt');
                } catch (err) {
                    console.log('[ ] OpenSSLEngineSocketImpl Conscrypt');
                }
        
                // OpenSSLSocketImpl Apache Harmony
                try {
                    const OpenSSLSocketImpl_Harmony = Java.use('org.apache.harmony.xnet.provider.jsse.OpenSSLSocketImpl');
                    OpenSSLSocketImpl_Harmony.verifyCertificateChain.implementation = function (asn1DerEncodedCertificateChain, authMethod) {
                        console.log('  --> Bypassing OpenSSLSocketImpl Apache Harmony');
                    };
                    console.log('[+] OpenSSLSocketImpl Apache Harmony');
                } catch (err) {
                    console.log('[ ] OpenSSLSocketImpl Apache Harmony');
                }
        
                // PhoneGap sslCertificateChecker (https://github.com/EddyVerbruggen/SSLCertificateChecker-PhoneGap-Plugin)
                try {
                    const phonegap_Activity = Java.use('nl.xservices.plugins.sslCertificateChecker');
                    phonegap_Activity.execute.overload('java.lang.String', 'org.json.JSONArray', 'org.apache.cordova.CallbackContext').implementation = function (a, b, c) {
                        console.log('  --> Bypassing PhoneGap sslCertificateChecker: ' + a);
                        return true;
                    };
                    console.log('[+] PhoneGap sslCertificateChecker');
                } catch (err) {
                    console.log('[ ] PhoneGap sslCertificateChecker');
                }
        
                // IBM MobileFirst pinTrustedCertificatePublicKey (double bypass)
                try {
                    // Bypass IBM MobileFirst {1}
                    const WLClient_Activity_1 = Java.use('com.worklight.wlclient.api.WLClient');
                    WLClient_Activity_1.getInstance().pinTrustedCertificatePublicKey.overload('java.lang.String').implementation = function (cert) {
                        console.log('  --> Bypassing IBM MobileFirst pinTrustedCertificatePublicKey (string): ' + cert);
                        return;
                    };
                    console.log('[+] IBM MobileFirst pinTrustedCertificatePublicKey (string)');
                } catch (err) {
                    console.log('[ ] IBM MobileFirst pinTrustedCertificatePublicKey (string)');
                }
                try {
                    // Bypass IBM MobileFirst {2}
                    const WLClient_Activity_2 = Java.use('com.worklight.wlclient.api.WLClient');
                    WLClient_Activity_2.getInstance().pinTrustedCertificatePublicKey.overload('[Ljava.lang.String;').implementation = function (cert) {
                        console.log('  --> Bypassing IBM MobileFirst pinTrustedCertificatePublicKey (string array): ' + cert);
                        return;
                    };
                    console.log('[+] IBM MobileFirst pinTrustedCertificatePublicKey (string array)');
                } catch (err) {
                    console.log('[ ] IBM MobileFirst pinTrustedCertificatePublicKey (string array)');
                }
        
                // IBM WorkLight (ancestor of MobileFirst) HostNameVerifierWithCertificatePinning (quadruple bypass)
                try {
                    // Bypass IBM WorkLight {1}
                    const worklight_Activity_1 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
                    worklight_Activity_1.verify.overload('java.lang.String', 'javax.net.ssl.SSLSocket').implementation = function (a, b) {
                        console.log('  --> Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSocket): ' + a);
                        return;
                    };
                    console.log('[+] IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSocket)');
                } catch (err) {
                    console.log('[ ] IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSocket)');
                }
                try {
                    // Bypass IBM WorkLight {2}
                    const worklight_Activity_2 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
                    worklight_Activity_2.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (a, b) {
                        console.log('  --> Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning (cert): ' + a);
                        return;
                    };
                    console.log('[+] IBM WorkLight HostNameVerifierWithCertificatePinning (cert)');
                } catch (err) {
                    console.log('[ ] IBM WorkLight HostNameVerifierWithCertificatePinning (cert)');
                }
                try {
                    // Bypass IBM WorkLight {3}
                    const worklight_Activity_3 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
                    worklight_Activity_3.verify.overload('java.lang.String', '[Ljava.lang.String;', '[Ljava.lang.String;').implementation = function (a, b) {
                        console.log('  --> Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning (string string): ' + a);
                        return;
                    };
                    console.log('[+] IBM WorkLight HostNameVerifierWithCertificatePinning (string string)');
                } catch (err) {
                    console.log('[ ] IBM WorkLight HostNameVerifierWithCertificatePinning (string string)');
                }
                try {
                    // Bypass IBM WorkLight {4}
                    const worklight_Activity_4 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
                    worklight_Activity_4.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (a, b) {
                        console.log('  --> Bypassing IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSession): ' + a);
                        return true;
                    };
                    console.log('[+] IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSession)');
                } catch (err) {
                    console.log('[ ] IBM WorkLight HostNameVerifierWithCertificatePinning (SSLSession)');
                }
        
                // Conscrypt CertPinManager
                try {
                    const conscrypt_CertPinManager_Activity = Java.use('com.android.org.conscrypt.CertPinManager');
                    conscrypt_CertPinManager_Activity.isChainValid.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                        console.log('  --> Bypassing Conscrypt CertPinManager: ' + a);
                        return true;
                    };
                    console.log('[+] Conscrypt CertPinManager');
                } catch (err) {
                    console.log('[ ] Conscrypt CertPinManager');
                }
        
                // CWAC-Netsecurity (unofficial back-port pinner for Android<4.2) CertPinManager
                try {
                    const cwac_CertPinManager_Activity = Java.use('com.commonsware.cwac.netsecurity.conscrypt.CertPinManager');
                    cwac_CertPinManager_Activity.isChainValid.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                        console.log('  --> Bypassing CWAC-Netsecurity CertPinManager: ' + a);
                        return true;
                    };
                    console.log('[+] CWAC-Netsecurity CertPinManager');
                } catch (err) {
                    console.log('[ ] CWAC-Netsecurity CertPinManager');
                }
        
                // Worklight Androidgap WLCertificatePinningPlugin
                try {
                    const androidgap_WLCertificatePinningPlugin_Activity = Java.use('com.worklight.androidgap.plugin.WLCertificatePinningPlugin');
                    androidgap_WLCertificatePinningPlugin_Activity.execute.overload('java.lang.String', 'org.json.JSONArray', 'org.apache.cordova.CallbackContext').implementation = function (a, b, c) {
                        console.log('  --> Bypassing Worklight Androidgap WLCertificatePinningPlugin: ' + a);
                        return true;
                    };
                    console.log('[+] Worklight Androidgap WLCertificatePinningPlugin');
                } catch (err) {
                    console.log('[ ] Worklight Androidgap WLCertificatePinningPlugin');
                }
        
                // Netty FingerprintTrustManagerFactory
                try {
                    const netty_FingerprintTrustManagerFactory = Java.use('io.netty.handler.ssl.util.FingerprintTrustManagerFactory');
                    netty_FingerprintTrustManagerFactory.checkTrusted.implementation = function (type, chain) {
                        console.log('  --> Bypassing Netty FingerprintTrustManagerFactory');
                    };
                    console.log('[+] Netty FingerprintTrustManagerFactory');
                } catch (err) {
                    console.log('[ ] Netty FingerprintTrustManagerFactory');
                }
        
                // Squareup CertificatePinner [OkHTTP<v3] (double bypass)
                try {
                    // Bypass Squareup CertificatePinner {1}
                    const Squareup_CertificatePinner_Activity_1 = Java.use('com.squareup.okhttp.CertificatePinner');
                    Squareup_CertificatePinner_Activity_1.check.overload('java.lang.String', 'java.security.cert.Certificate').implementation = function (a, b) {
                        console.log('  --> Bypassing Squareup CertificatePinner (cert): ' + a);
                        return;
                    };
                    console.log('[+] Squareup CertificatePinner (cert)');
                } catch (err) {
                    console.log('[ ] Squareup CertificatePinner (cert)');
                }
                try {
                    // Bypass Squareup CertificatePinner {2}
                    const Squareup_CertificatePinner_Activity_2 = Java.use('com.squareup.okhttp.CertificatePinner');
                    Squareup_CertificatePinner_Activity_2.check.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                        console.log('  --> Bypassing Squareup CertificatePinner (list): ' + a);
                        return;
                    };
                    console.log('[+] Squareup CertificatePinner (list)');
                } catch (err) {
                    console.log('[ ] Squareup CertificatePinner (list)');
                }
        
                // Squareup OkHostnameVerifier [OkHTTP v3] (double bypass)
                try {
                    // Bypass Squareup OkHostnameVerifier {1}
                    const Squareup_OkHostnameVerifier_Activity_1 = Java.use('com.squareup.okhttp.internal.tls.OkHostnameVerifier');
                    Squareup_OkHostnameVerifier_Activity_1.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (a, b) {
                        console.log('  --> Bypassing Squareup OkHostnameVerifier (cert): ' + a);
                        return true;
                    };
                    console.log('[+] Squareup OkHostnameVerifier (cert)');
                } catch (err) {
                    console.log('[ ] Squareup OkHostnameVerifier (cert)');
                }
                try {
                    // Bypass Squareup OkHostnameVerifier {2}
                    const Squareup_OkHostnameVerifier_Activity_2 = Java.use('com.squareup.okhttp.internal.tls.OkHostnameVerifier');
                    Squareup_OkHostnameVerifier_Activity_2.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (a, b) {
                        console.log('  --> Bypassing Squareup OkHostnameVerifier (SSLSession): ' + a);
                        return true;
                    };
                    console.log('[+] Squareup OkHostnameVerifier (SSLSession)');
                } catch (err) {
                    console.log('[ ] Squareup OkHostnameVerifier (SSLSession)');
                }
        
                // Android WebViewClient (double bypass)
                try {
                    // Bypass WebViewClient {1} (deprecated from Android 6)
                    const AndroidWebViewClient_Activity_1 = Java.use('android.webkit.WebViewClient');
                    AndroidWebViewClient_Activity_1.onReceivedSslError.overload('android.webkit.WebView', 'android.webkit.SslErrorHandler', 'android.net.http.SslError').implementation = function (obj1, obj2, obj3) {
                        console.log('  --> Bypassing Android WebViewClient (SslErrorHandler)');
                    };
                    console.log('[+] Android WebViewClient (SslErrorHandler)');
                } catch (err) {
                    console.log('[ ] Android WebViewClient (SslErrorHandler)');
                }
                try {
                    // Bypass WebViewClient {2}
                    const AndroidWebViewClient_Activity_2 = Java.use('android.webkit.WebViewClient');
                    AndroidWebViewClient_Activity_2.onReceivedSslError.overload('android.webkit.WebView', 'android.webkit.WebResourceRequest', 'android.webkit.WebResourceError').implementation = function (obj1, obj2, obj3) {
                        console.log('  --> Bypassing Android WebViewClient (WebResourceError)');
                    };
                    console.log('[+] Android WebViewClient (WebResourceError)');
                } catch (err) {
                    console.log('[ ] Android WebViewClient (WebResourceError)');
                }
        
                // Apache Cordova WebViewClient
                try {
                    const CordovaWebViewClient_Activity = Java.use('org.apache.cordova.CordovaWebViewClient');
                    CordovaWebViewClient_Activity.onReceivedSslError.overload('android.webkit.WebView', 'android.webkit.SslErrorHandler', 'android.net.http.SslError').implementation = function (obj1, obj2, obj3) {
                        console.log('  --> Bypassing Apache Cordova WebViewClient');
                        obj3.proceed();
                    };
                } catch (err) {
                    console.log('[ ] Apache Cordova WebViewClient');
                }
        
                // Boye AbstractVerifier
                try {
                    const boye_AbstractVerifier = Java.use('ch.boye.httpclientandroidlib.conn.ssl.AbstractVerifier');
                    boye_AbstractVerifier.verify.implementation = function (host, ssl) {
                        console.log('  --> Bypassing Boye AbstractVerifier: ' + host);
                    };
                } catch (err) {
                    console.log('[ ] Boye AbstractVerifier');
                }
        
                console.log("Unpinning setup completed");
                console.log("---");
            });
        
        }, 0);

        Java.perform(function () {
            var CertificatePinner = Java.use("okhttp3.CertificatePinner");
            CertificatePinner.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function(p0, p1){
                console.log("Called! [Certificate]");
                return;
            };
            CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function(p0, p1){
                console.log("Called! [List]");
                return;
            };
        });
        setTimeout(function() {
            Java.perform(function() {
               
            var array_list = Java.use("java.util.ArrayList");
            var ApiClient = Java.use('com.android.org.conscrypt.TrustManagerImpl');
        
            ApiClient.checkTrustedRecursive.implementation = function(a1, a2, a3, a4, a5, a6) {
                var k = array_list.$new();
                return k;
            }
                var CommonUtils = Java.use('l.a.a.a.o.b.i');
                CommonUtils.i.overload('android.content.Context').implementation = function(context) {
                    console.log("[+] bypassRootDetection");
                    return false;
                }
            });
        }, 0);
        Java.perform(function() {

            var use_single_byte = false;
            var complete_bytes = new Array();
            var index = 0;
        
        
            var secretKeySpecDef = Java.use('javax.crypto.spec.SecretKeySpec');
        
            var ivParameterSpecDef = Java.use('javax.crypto.spec.IvParameterSpec');
        
            var cipherDef = Java.use('javax.crypto.Cipher');
        
            var cipherDoFinal_1 = cipherDef.doFinal.overload();
            var cipherDoFinal_2 = cipherDef.doFinal.overload('[B');
            var cipherDoFinal_3 = cipherDef.doFinal.overload('[B', 'int');
            var cipherDoFinal_4 = cipherDef.doFinal.overload('[B', 'int', 'int');
            var cipherDoFinal_5 = cipherDef.doFinal.overload('[B', 'int', 'int', '[B');
            var cipherDoFinal_6 = cipherDef.doFinal.overload('[B', 'int', 'int', '[B', 'int');
        
            var cipherUpdate_1 = cipherDef.update.overload('[B');
            var cipherUpdate_2 = cipherDef.update.overload('[B', 'int', 'int');
            var cipherUpdate_3 = cipherDef.update.overload('[B', 'int', 'int', '[B');
            var cipherUpdate_4 = cipherDef.update.overload('[B', 'int', 'int', '[B', 'int');
        
            var secretKeySpecDef_init_1 = secretKeySpecDef.$init.overload('[B', 'java.lang.String');
        
            var secretKeySpecDef_init_2 = secretKeySpecDef.$init.overload('[B', 'int', 'int', 'java.lang.String');
        
            var ivParameterSpecDef_init_1 = ivParameterSpecDef.$init.overload('[B');
        
            var ivParameterSpecDef_init_2 = ivParameterSpecDef.$init.overload('[B', 'int', 'int');
        
            secretKeySpecDef_init_1.implementation = function(arr, alg) {
                var key = b2s(arr);
                send("Creating " + alg + " secret key, plaintext:\\n" + hexdump(key));
                return secretKeySpecDef_init_1.call(this, arr, alg);
            }
        
            secretKeySpecDef_init_2.implementation = function(arr, off, len, alg) {
                var key = b2s(arr);
                send("Creating " + alg + " secret key, plaintext:\\n" + hexdump(key));
                return secretKeySpecDef_init_2.call(this, arr, off, len, alg);
            }
        
            /*ivParameterSpecDef_init_1.implementation = function(arr)
            {
                var iv = b2s(arr);
                send("Creating IV:\\n" + hexdump(iv));
                return ivParameterSpecDef_init_1.call(this, arr);
            }
        
            ivParameterSpecDef_init_2.implementation = function(arr, off, len)
            {
                var iv = b2s(arr);
                send("Creating IV, plaintext:\\n" + hexdump(iv));
                return ivParameterSpecDef_init_2.call(this, arr, off, len);
            }*/
        
            cipherDoFinal_1.implementation = function() {
                var ret = cipherDoFinal_1.call(this);
                info(this.getIV(), this.getAlgorithm(), complete_bytes, ret);
                return ret;
            }
        
            cipherDoFinal_2.implementation = function(arr) {
                addtoarray(arr);
                var ret = cipherDoFinal_2.call(this, arr);
                info(this.getIV(), this.getAlgorithm(), complete_bytes, ret);
                return ret;
            }
        
            cipherDoFinal_3.implementation = function(arr, a) {
                addtoarray(arr);
                var ret = cipherDoFinal_3.call(this, arr, a);
                info(this.getIV(), this.getAlgorithm(), complete_bytes, ret);
                return ret;
            }
        
            cipherDoFinal_4.implementation = function(arr, a, b) {
                addtoarray(arr);
                var ret = cipherDoFinal_4.call(this, arr, a, b);
                info(this.getIV(), this.getAlgorithm(), complete_bytes, ret);
                return ret;
            }
        
            cipherDoFinal_5.implementation = function(arr, a, b, c) {
                addtoarray(arr);
                var ret = cipherDoFinal_5.call(this, arr, a, b, c);
                info(this.getIV(), this.getAlgorithm(), complete_bytes, ret);
                return ret;
            }
        
            cipherDoFinal_6.implementation = function(arr, a, b, c, d) {
                addtoarray(arr);
                var ret = cipherDoFinal_6.call(this, arr, a, b, c, d);
                info(this.getIV(), this.getAlgorithm(), complete_bytes, c);
                return ret;
            }
        
            cipherUpdate_1.implementation = function(arr) {
                addtoarray(arr);
                return cipherUpdate_1.call(this, arr);
            }
        
            cipherUpdate_2.implementation = function(arr, a, b) {
                addtoarray(arr);
                return cipherUpdate_2.call(this, arr, a, b);
            }
        
            cipherUpdate_3.implementation = function(arr, a, b, c) {
                addtoarray(arr);
                return cipherUpdate_3.call(this, arr, a, b, c);
            }
        
            cipherUpdate_4.implementation = function(arr, a, b, c, d) {
                addtoarray(arr);
                return cipherUpdate_4.call(this, arr, a, b, c, d);
            }
        
            function info(iv, alg, plain, encoded) {
                send("Performing encryption/decryption");
                if (iv) {
                    send("Initialization Vector: \\n" + hexdump(b2s(iv)));
                } else {
                    send("Initialization Vector: " + iv);
                }
                send("Algorithm: " + alg);
                send("In: \\n" + hexdump(b2s(plain)));
                send("Out: \\n" + hexdump(b2s(encoded)));
                complete_bytes = [];
                index = 0;
            }
        
            function hexdump(buffer, blockSize) {
                blockSize = blockSize || 16;
                var lines = [];
                var hex = "0123456789ABCDEF";
                for (var b = 0; b < buffer.length; b += blockSize) {
                    var block = buffer.slice(b, Math.min(b + blockSize, buffer.length));
                    var addr = ("0000" + b.toString(16)).slice(-4);
                    var codes = block.split('').map(function(ch) {
                        var code = ch.charCodeAt(0);
                        return " " + hex[(0xF0 & code) >> 4] + hex[0x0F & code];
                    }).join("");
                    codes += "   ".repeat(blockSize - block.length);
                    var chars = block.replace(/[\\x00-\\x1F\\x20]/g, '.');
                    chars += " ".repeat(blockSize - block.length);
                    lines.push(addr + " " + codes + "  " + chars);
                }
                return lines.join("\\n");
            }
        
            function b2s(array) {
                var result = "";
                for (var i = 0; i < array.length; i++) {
                    result += String.fromCharCode(modulus(array[i], 256));
                }
                return result;
            }
        
            function modulus(x, n) {
                return ((x % n) + n) % n;
            }
        
            function addtoarray(arr) {
                for (var i = 0; i < arr.length; i++) {
                    complete_bytes[index] = arr[i];
                    index = index + 1;
                }
            }
        });
        function byteArrayToString(arrayBuffer) {
            return String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
        }
        
        Java.perform(() => {
            const secretKeySpec = Java.use('javax.crypto.spec.SecretKeySpec');
            secretKeySpec.$init.overload('[B', 'java.lang.String').implementation = function(key, algo) {
                console.log('key:' + byteArrayToString(key));
                console.log('algo:' + algo);
                return this.$init(key, algo);
            };
        
            const cipher = Java.use('javax.crypto.Cipher')['doFinal'].overload('[B').implementation = function(byteArray) {
                console.log('encode:' + byteArrayToString(byteArray));
                return this.doFinal(byteArray);
            };
        });