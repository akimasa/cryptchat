function TrueRandomGen(){
	this.collectedRandom = [];
	this.randSeed;
	this.seedHashed=0;
	return this;
}
TrueRandomGen.prototype.collectRandom = function (callback,progress){
	var that = this;
	if(progress)
	progress.value=0;
	$(window).mousemove(function(e){
			if(progress)
			progress.value++;
			//console.log(e.pageX+":"+e.pageY+":"+e.timeStamp)
			var xy =[e.pageX,e.pageY,e.timeStamp];
			//that.collectedRandom = this.collectedRandom+":"+e.pageX+":"+e.pageY+":"+e.timeStamp;
			that.collectedRandom.push(xy);
			//console.log(that.collectedRandom);
			if(that.collectedRandom.length >= 100){
			that.randSeed = SHA256(that.randSeed+":"+JSON.stringify(that.collectedRandom));
			console.log(that.randSeed.toString());
			that.collectedRandom = [];
			that.seedHashed++;
			//	$(window).off("mousemove");
			}
			if(that.seedHashed >=1){
			console.log("end");
			$(window).off("mousemove");
			callback(that.randSeed);
			}
			});
}

