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
RSAKey.prototype.toPubString = function (){
	var obj = { n:this.n.toString(16),
		e:this.e,
	};
	return JSON.stringify(obj);
}
RSAKey.prototype.loadJSON = function (json){
	var key = JSON.parse(json);
	this.n = parseBigInt(key.n,16);
	this.e = key.e;
	this.d = parseBigInt(key.d,16);
	this.p = parseBigInt(key.p,16);
	this.q = parseBigInt(key.q,16);
	this.dmp1 = parseBigInt(key.dmp1,16);
	this.dmq1 = parseBigInt(key.dmq1,16);
	this.coeff = parseBigInt(key.coeff,16);
}
RSAKey.prototype.encodeAESKey = function (bytes){
	try{
		encrypted = this.encrypt(cryptico.bytes2string(bytes));
		return encrypted;
	} catch(e) {
		console.log(e);
		//return {status: "Invalid public key"};
		return e;
	}

}
RSAKey.prototype.decodeAESKey = function (bytes){
	try{
		decoded = this.decrypt(bytes);
		console.log(decoded);
		return cryptico.string2bytes(decoded);
	}catch(e){
		console.log(e);
		return e;
	}

}
RSAKey.prototype.encryptSessionKey = function (str){
	try{
		encrypted = this.encrypt(str);
		return encrypted;
	} catch(e) {
		console.log(e);
		//return {status: "Invalid public key"};
		return e;
	}

}
RSAKey.prototype.decryptSessionKey = function (bytes){
	try{
		decoded = this.decrypt(bytes);
		return decoded;
	}catch(e){
		console.log(e);
		return e;
	}

}
RSAKey.prototype.getFingerprint = function (){
	return SHA256(this.toPubString());
}
function str2b64(str){
	var parsed = CryptoJS.enc.Utf8.parse(str);
	var b64 = CryptoJS.enc.Base64.stringify(parsed);
	return b64;
}
function b642str(b64){
	var bytes = CryptoJS.enc.Base64.parse(b64);
	return CryptoJS.enc.Utf8.stringify(bytes); 
}
function encMes(obj){
	var mesJson = JSON.stringify(obj);
	return CryptoJS.AES.encrypt(mesJson,$("#seskey").val()).toString();
}
function decMes(cipher){
	var mesJson = CryptoJS.AES.decrypt(cipher,$("#seskey").val()).toString(CryptoJS.enc.Utf8);
	var mesObj = JSON.parse(mesJson);
	return mesObj;
}
function hashDB(name){
	this.name = name;
	try {
		this.db = JSON.parse(localStorage.getItem(name));
	if(!this.db)
		this.db = {};
	} catch (e){
		this.db = {}
	}
}
hashDB.prototype.getItem = function (item){
	try{
	return this.db[item];
	} catch(e) {
		return null;
	}
}
hashDB.prototype.setItem = function (item, data){
	this.db[item] = data;
	localStorage.setItem(this.name,JSON.stringify(this.db));
}
hashDB.prototype.deleteItem = function (item){
	delete this.db[item];
	localStorage.setItem(this.name,JSON.stringify(this.db));
}
hashDB.prototype.clear = function (){
	localStorage.setItem(this.name,"");
	this.db = {};
}
var socket;
var myRSAKey;
var trusted;
var myID;
var waitIHaveKeyTimer;
$(function(){
	trusted = new hashDB("trusted_"+$("#room").val());
	socket = io.connect('/');
	$("#main").css("display","none");

});
function genKey(){
	$("#login input[type=submit]").attr("disabled","disabled");
	$("#infomsg").text("please wait until keys are generated");
	var randseed = $("#email").val() + ":" + $("#password").val();
	try{
		var key = localStorage.getItem("key");
		var keyJSON = CryptoJS.AES.decrypt(key ,randseed).toString(CryptoJS.enc.Utf8);
		var keyObj = JSON.parse(keyJSON);
		var keyStr = JSON.stringify(keyObj);
		$("#key").val(keyStr);
		myRSAKey = new RSAKey();
		myRSAKey.loadJSON(keyStr);
		seedrandom();
	} catch(e) {
		console.log(e);
		//return;
		if(typeof(Worker !== "undefined") && $("#useworker").is(":checked")) {
			var before = (new Date()).getTime();
			var worker = new Worker("/javascripts/work.js");
			worker.onmessage = function(event) {
				myRSAKey = new RSAKey();
				myRSAKey.loadJSON(event.data);

				$("#key").val(myRSAKey.toString());

				var key = $("#key").val();
				var enckey = CryptoJS.AES.encrypt(key,randseed).toString();
				localStorage.setItem("key",enckey);
				//自分自身を信頼する
				trusted.setItem(myRSAKey.getFingerprint(),{mail:$("#email").val(),pubKey:myRSAKey.toPubString()});
				var after = (new Date().getTime());
				console.log("generateRSAKey(worker):"+(after-before)+"ms");
				seedrandom();
			};
			worker.postMessage(randseed);
			$("#progress").removeAttr("max").removeAttr("value");
		} else {
			var before = (new Date()).getTime();
			myRSAKey = cryptico.generateRSAKey(randseed,1024);
			var after = (new Date().getTime());
			console.log("generateRSAKey:"+(after-before)+"ms");
			$("#key").val(myRSAKey.toString());

			var key = $("#key").val();
			var enckey = CryptoJS.AES.encrypt(key,randseed).toString();
			localStorage.setItem("key",enckey);
			//自分自身を信頼する
			trusted.setItem(myRSAKey.getFingerprint(),{mail:$("#email").val(),pubKey:myRSAKey.toPubString()});
			seedrandom();
		}


	}
}
function seedrandom(){
	$("#infomsg").text("please move your mouse");
	r = new TrueRandomGen();
	r.collectRandom(function(s){ 
			Math.seedrandom(s);
			//login後の処理

			socket.on("mes",function(mes){
				var before = (new Date()).getTime();
				try {
				if(mes.mode == "mes")
					update(mes);
				if(mes.mode == "reqSesKey")
					reqSesKey(mes);
				if(mes.mode == "resSesKey")
					resSesKey(mes);
				if(mes.mode == "reKey")
					reKey(mes);
				if(mes.mode == "IHaveKey")
					processIHaveKey(mes);
				} catch (e) {
					console.log(e);
				}
				var after = (new Date()).getTime();
				console.log((after-before)+"ms");
			});
			socket.emit("init",{room:$("#room").val()});

			$("#login").css("display","none");
			$("#main").css("display","");
			$("#myemail").text($("#email").val());
			$("#message").attr("disabled","disabled");
			myID = MD5(myRSAKey.getFingerprint() + (new Date()).getTime());
			emitPubKey("init");
			waitIHaveKeyTimer = setTimeout(function(){
				if($("#seskey").val() == ""){
					emitReKey();
				}

			},5000);
			},document.getElementById("progress"));
}

function send(){

	var message = $("#message").val();
	var mail = $("#email").val();
	message = str2b64(message);
	var mesObj = {mail:mail,
		message:message,
		fingerprint:myRSAKey.getFingerprint(),
		time:(new Date()).getTime()
		};
	mesObj = encMes(mesObj);
	var sig = myRSAKey.signString(mesObj, "sha256");
	socket.emit("mes",{cipher:mesObj,sig:sig,mode:"mes"});
	$("#message").val("")
}
function update(m){
	try {
		var mes = decMes(m.cipher);
		mes.message = b642str(mes.message);


		var $oDiv = $("<div />").addClass("message");
		$oDiv.append(formatTime(mes.time));
		if(trusted.getItem(mes.fingerprint)){
			if(trusted.getItem(mes.fingerprint).mail == mes.mail){
				$oDiv.append($("<span />").text(mes.mail+":").addClass("email"));
			} else {
				$oDiv.append($("<span />").text(mes.mail+":").addClass("email").addClass("forged"));
				var $oForgedMail = $("<div />").addClass("warning").text("forged mail address");
			}
		} else {
			$oDiv.append($("<span />").text(mes.mail+":").addClass("email").addClass("untrusted"));
			var $oForgedMail = $("<div />").addClass("warning").text("untrusted mail address");
		}
		$oDiv.append($("<span />").text(mes.message).addClass("message"));
		if(trusted.getItem(mes.fingerprint)){
			var pubKey = new RSAKey();
			pubKey.loadJSON(trusted.getItem(mes.fingerprint).pubKey);
			if(pubKey.verifyString(m.cipher,m.sig)){

			} else {
				var $oWarn = $("<div />").addClass("warning").text("verify failed");
				$oDiv.addClass("forged");
			}
		} else {
			var $oWarn = $("<div />").addClass("warning").text("untrusted");
			$oDiv.addClass("untrusted");
		}
		$("#chat").append($oDiv);
	} catch (e) {
		var $oWarn = $("<div />").addClass("warning").text("cannot decrypt");
	}
	if($oWarn)
		$("#chat").append($oWarn);
	if($oForgedMail)
		$("#chat").append($oForgedMail);
}
function makeDialog(callback,mes,yes,no){
	var $oDiv = $("<div />").addClass("dialog");
	if(mes instanceof jQuery){
		$oDiv.append(mes.addClass("mes"));
	} else {
		$oDiv.append($("<span />").text(mes).addClass("mes"));
	}
	if(!yes)
		var yes="yes";
	$oDiv.append($("<button>")
			.text(yes)
			.addClass("yes")
			.click(function(){
				callback(true);	
				$(this.parentNode).remove();
			}));
	if(!no)
		var no="no";
	$oDiv.append($("<button>")
			.text(no)
			.addClass("no")
			.click(function(){
				callback(false);	
				$(this.parentNode).remove();
			}));
	$("#dialogs").append($oDiv);
	return $oDiv;
}

function reqSesKey(mes){
	if(mes.caller == "init"){
		var $oDiv = $("<div />").addClass("login");
		$oDiv.append(formatTime(new Date()));
		$oDiv.append($("<span />").text(mes.mail).addClass("mail"));
		$oDiv.append(document.createTextNode("が入室しました"));
		$("#chat").append($oDiv);
	}

	var sesKey = $("#seskey").val();
	if(sesKey == "" || mes.id == myID){
		return;
	}
	var pubKey = new RSAKey();
	pubKey.loadJSON(mes.pubKey);
	var encSesKey = pubKey.encryptSessionKey(sesKey);
	sendIHaveKey(mes);
	if(trusted.getItem(pubKey.getFingerprint())){
		sendSesKey(encSesKey,mes.id);
	} else {
		var $p = $("<span />").addClass("askTrust");
		$p.append($("<span />").text(mes.mail).addClass("mail"));		
		$p.append(document.createTextNode("("));
		$p.append($("<span />").text(pubKey.getFingerprint()).addClass("fingerprint"));		
		$p.append(document.createTextNode(")を信用して鍵を送る？"));
		var dialog = makeDialog(function (answer){
			if(answer){
				trusted.setItem(pubKey.getFingerprint(),{mail:mes.mail,pubKey:mes.pubKey});
				sendSesKey(encSesKey,mes.id);
			}
		},$p);
		setTimeout(function(){ dialog.hide(1000,function() { dialog.remove() }) },10000);
	}
}
function sendSesKey(encSesKey,id){
	socket.emit("mes",{encKey:encSesKey,
		id:id,
		mail:$("#email").val(),
		pubKey:myRSAKey.toPubString(),
		encKeySig: myRSAKey.signString(encSesKey,"sha256"),
		mode:"resSesKey"});

}
function resSesKey(mes){
	var pubKey = new RSAKey();
	pubKey.loadJSON(mes.pubKey);
	if($("#seskey").val() != "" || myID != mes.id || !pubKey.verifyString(mes.encKey,mes.encKeySig))
		return;
	if(trusted.getItem(pubKey.getFingerprint())){
		$("#seskey").val(myRSAKey.decryptSessionKey(mes.encKey));
		$("#message").removeAttr("disabled");
	} else {
		var $p = $("<span />").addClass("askTrust");
		$p.append($("<span />").text(mes.mail).addClass("mail"));		
		$p.append(document.createTextNode("("));
		$p.append($("<span />").text(pubKey.getFingerprint()).addClass("fingerprint"));		
		$p.append(document.createTextNode(")を信用して鍵を受け取る？"));
		var dialog = makeDialog(function (answer){
			if(answer){
				trusted.setItem(pubKey.getFingerprint(),{mail:mes.mail,pubKey:mes.pubKey});
				$("#seskey").val(myRSAKey.decryptSessionKey(mes.encKey));
				$("#message").removeAttr("disabled");
			}
		},$p);
	}
	$("#seskey").val(myRSAKey.decryptSessionKey(mes.encKey));
	$("#message").removeAttr("disabled");
}
function reKey(mes){
	if(mes.id == myID)
		return;
	emitPubKey("reKey");
}
function emitPubKey(caller){
	$("#seskey").val("");
	var pubKeyStr = myRSAKey.toPubString();
	socket.emit("mes",{pubKey:pubKeyStr,
		mail:$("#email").val(),
		id:myID,
		caller:caller,
		mode:"reqSesKey"});
}
function emitReKey(){
	genSesKey();
	socket.emit("mes",{mode:"reKey",id: myID});
}
function genSesKey(){

	var key = new Array(32);
	var r = new SecureRandom();
	r.nextBytes(key);

	var sessionKey = cryptico.bytes2string(key);
	$("#seskey").val(sessionKey);
	$("#message").removeAttr("disabled");
}
function sendIHaveKey(mes){
	socket.emit("mes",{mode:"IHaveKey",id:mes.id});
}
function processIHaveKey(mes){
	if(mes.id == myID)
		clearTimeout(waitIHaveKeyTimer);
}
function formatTime(time){
		time = new Date(time);
		return $("<span />").text("["+((time.getHours()<10) ? "0"+time.getHours() : time.getHours())+":"+((time.getMinutes()<10) ? "0"+time.getMinutes() : time.getMinutes())+"]").addClass("time").attr("title",time.toString());
}
