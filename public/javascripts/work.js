self.onmessage = function(event) {
	importScripts("/javascripts/cryptico/jsbn.js","/javascripts/cryptico/random.js","/javascripts/cryptico/hash.js","/javascripts/cryptico/rsa.js","/javascripts/cryptico/aes.js","/javascripts/cryptico/api.js");
	RSAKey.prototype.toString = function (){
		var obj = { n:this.n.toString(16),
			e:this.e,
			d:this.d.toString(16),
			p:this.p.toString(16),
			q:this.q.toString(16),
			dmp1:this.dmp1.toString(16),
			dmq1:this.dmq1.toString(16),
			coeff:this.coeff.toString(16),
		};
		return JSON.stringify(obj);
	}

	var myRSAKey = cryptico.generateRSAKey(event.data, 1024);
	self.postMessage(myRSAKey.toString());
};
