function TrueRandomGen(){
	this.collectedRandom = [];
	this.randSeed;
	this.seedHashed=0;
	this.hashTimes=1;
	return this;
}
TrueRandomGen.prototype.collectRandom = function (callback,progress){
	var that = this;
	if(progress){
		progress.value=0;
		progress.max=this.hashTimes*100;
	}
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
			if(that.seedHashed >=that.hashTimes){
			$(window).off("devicemotion");
			$(window).off("mousemove");
			callback(that.randSeed);
			}
			});
		$(window).on('devicemotion', function(event){
			ax = event.originalEvent.accelerationIncludingGravity.x;
			ay = event.originalEvent.accelerationIncludingGravity.y;
			az = event.originalEvent.accelerationIncludingGravity.z;
//			$("#result").html(ax+"<br>"+ay+"<br>"+az);
			if(progress)
			progress.value++;
			var xy =[ax,ay,az];
			that.collectedRandom.push(xy);
			if(that.collectedRandom.length >= 100){
			that.randSeed = SHA256(that.randSeed+":"+JSON.stringify(that.collectedRandom));
			console.log(that.randSeed.toString());
			that.collectedRandom = [];
			that.seedHashed++;
			}
			if(that.seedHashed >=that.hashTimes){
			$(window).off("devicemotion");
			$(window).off("mousemove");
			callback(that.randSeed);
			}
		});
		/*
		$(window).scroll(function(){
			$("#result").html($(this).scrollTop()+"<br>"+$(this).scrollLeft());
		});
		*/
		setTimeout(function(){ 
			if(progress.value == 0){
				$(window).off("devicemotion");
				$(window).off("mousemove");
			}
		},5000);
}

