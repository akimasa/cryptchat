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
$(function(){
	trusted = new hashDB("trusted_"+$("#room").val());
	socket = io.connect('/');
	socket.on("mes",function(mes){
		if(mes.mode == "mes")
		update(mes);
		if(mes.mode == "reqSesKey")
		reqSesKey(mes);
		if(mes.mode == "resSesKey")
		resSesKey(mes);
		if(mes.mode == "reKey")
		reKey(mes);
	});
	socket.emit("init",{room:$("#room").val()});
	//debug code
	$("#email").val("test@example.com");
	$("#password").val("password");
	//end debug code
	$("#main").css("display","none");

});
function genKey(){
	var randseed = $("#email").val() + ":" + $("#password").val();
	try{
		var key = localStorage.getItem("key");
		var keyJSON = CryptoJS.AES.decrypt(key ,randseed).toString(CryptoJS.enc.Utf8);
		var keyObj = JSON.parse(keyJSON);
		var keyStr = JSON.stringify(keyObj);
		$("#key").val(keyStr);
		myRSAKey = new RSAKey();
		myRSAKey.loadJSON(keyStr);
	} catch(e) {
		console.log(e);
		//return;
		myRSAKey = cryptico.generateRSAKey(randseed,1024);
		$("#key").val(myRSAKey.toString());

		var key = $("#key").val();
		var enckey = CryptoJS.AES.encrypt(key,randseed).toString();
		localStorage.setItem("key",enckey);
	}
	seedrandom();
}
function seedrandom(){
	r = new trueRandomGen();
	r.collectRandom(function(s){ 
			Math.seedrandom(s);
			//login後の処理
			$("#login").css("display","none");
			$("#main").css("display","");
			$("#myemail").text($("#email").val());
			$("#messege").attr("disabled","disabled");
			emitPubKey();
			setTimeout(function(){
				console.log("15seconds passed");
				if($("#seskey").val() == ""){
					console.log("genseskey & emitrekey");
					genSesKey();
					emitReKey();
				}

			},15000);
			},document.getElementById("progress"));
}

function send(){

	var messege = $("#messege").val();
	var email = $("#email").val();
	messege = str2b64(messege);
	var mesObj = {email:email,
		messege:messege,
		time:(new Date()).getTime()
		};
	mesObj = encMes(mesObj);
	socket.emit("mes",{cipher:mesObj,mode:"mes"});

}
function update(mes){
	console.log(mes);
	mes = decMes(mes.cipher);
	mes.messege = b642str(mes.messege);
	var time = new Date(mes.time);

	var $oDiv = $("<div />").addClass("messege");
	$oDiv.append($("<span>").text("["+((time.getHours()<10) ? "0"+time.getHours() : time.getHours())
+":"+((time.getMinutes()<10) ? "0"+time.getMinutes() : time.getMinutes())+"]").addClass("time"))
		.attr("title",time.toString());
	$oDiv.append($("<span>").text(mes.email+":").addClass("email"));
	$oDiv.append($("<span>").text(mes.messege).addClass("messege"));

	$("#chat").append($oDiv);
}
function makeDialog(callback,mes,yes,no){
	var $oDiv = $("<div />").addClass("dialog");
	if(mes instanceof jQuery){
		$oDiv.append(mes.addClass("mes"));
	} else {
		$oDiv.append($("<span>").text(mes).addClass("mes"));
	}
	if(!yes)
		var yes="yes";
	$oDiv.append($("<span>")
			.text(yes)
			.addClass("yes")
			.click(function(){
				callback(true);	
				$(this.parentNode).remove();
			}));
	if(!no)
		var no="no";
	$oDiv.append($("<span>")
			.text(no)
			.addClass("no")
			.click(function(){
				callback(false);	
				$(this.parentNode).remove();
			}));
	$("#dialogs").append($oDiv);
	return $oDiv;
}

function store(){
	var key = $("#key").val();
	var enckey = CryptoJS.AES.encrypt(key,$("#password").val()).toString();
	localStorage.setItem("key",enckey);
//	alert(localStorage.getItem("key"))
}
function reqSesKey(mes){
	var sesKey = $("#seskey").val();
	var pubKey = new RSAKey();
	pubKey.loadJSON(mes.pubKey);
	var encSesKey = pubKey.encryptSessionKey(sesKey);
	if(pubKey.getFingerprint() == myRSAKey.getFingerprint()){
		console.log("pubkey=mykey. return");
		return;
	} else {
		if(trusted.getItem(pubKey.getFingerprint())){
			console.log("trusted send key");
			sendSesKey(encSesKey);
		} else {
			var $p = $("<span>").addClass("askTrust");
			$p.append($("<span>").text(mes.mail).addClass("mail"));		
			$p.append(document.createTextNode("("));
			$p.append($("<span>").text(pubKey.getFingerprint()).addClass("fingerprint"));		
			$p.append(document.createTextNode(")を信用して鍵を送る？"));
			var dialog = makeDialog(function (answer){
				if(answer){
					console.log("yes")
					console.log(pubKey.getFingerprint());
					trusted.setItem(pubKey.getFingerprint(),{mail:mes.mail});
					sendSesKey(encSesKey);
				}
			},$p);
			setTimeout(function(){ dialog.hide(1000,function() { dialog.remove() }) },10000);
		}
	}
}
function sendSesKey(encSesKey){
	socket.emit("mes",{encKey:encSesKey,
		mode:"resSesKey"});

}
function resSesKey(mes){
	if($("#seskey").val() != "")
		return;
	$("#seskey").val(myRSAKey.decryptSessionKey(mes.encKey));
	$("#messege").removeAttr("disabled");
}
function reKey(mes){
	console.log("rekey: emitpubkey");
	if(mes.fingerprint == myRSAKey.getFingerprint()){
		console.log("my rekey req.ignore")
	} else {
		emitPubKey();
	}
}
function emitPubKey(){
	$("#seskey").val("");
	var pubKeyStr = myRSAKey.toPubString();
	socket.emit("mes",{pubKey:pubKeyStr,
		mail:$("#email").val(),
		mode:"reqSesKey"});
}
function emitReKey(){
	socket.emit("mes",{mode:"reKey",fingerprint:myRSAKey.getFingerprint()});
}
function genSesKey(){

	var key = new Array(32);
	var r = new SecureRandom();
	r.nextBytes(key);

	var sessionKey = cryptico.bytes2string(key);
	$("#seskey").val(sessionKey);
	$("#messege").removeAttr("disabled");
}
