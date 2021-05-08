let bs, myCam;

function smooth_transpose2d(d)
{
	if(d < 0) return 0;
	else if(d > 1) return 1;
	return d*d*d;
}
function randto(min, max, integer=false)
{
	let dist=max-min;
	let res=Math.random() * dist + min;
	if(integer) res=Math.floor(res);
	return res;
}

const BLOB_TRANS_DURAITION = 120;
class blob
{
	constructor(x,y,z, isSplit=false)
	{
		this._pos=[x,y,z];
		let rand3d=p5.Vector.random3D();
		this.dir=[rand3d.x, rand3d.y, rand3d.z];
		this.scale=constrain(randomGaussian(75,25), 0, 150);
		this.r=0;
		this.frame=BLOB_TRANS_DURAITION;
		this.state='g'; //g:generate i:idle s:split d:destroy x:pending-removal _:pending-split
		if(isSplit) this.state = '_';
	}
	get pos()
	{
		return [this._pos[0], this._pos[1], this._pos[2]];
	}
	movement()
	{
		let acc = [this.dir[0], this.dir[1], this.dir[2]];
		if(this.state == 'g')
		{
			this.r=this.scale * smooth_transpose2d( (BLOB_TRANS_DURAITION-this.frame)/BLOB_TRANS_DURAITION );
			this.frame--;
			if(this.frame <= 0) this.state = 'i';
		}
		else if(this.state == '_')
		{
			this.frame--;
			if(this.frame <= 0) {this.state = 's'; this.frame = BLOB_TRANS_DURAITION;}
		}
		else if(this.state == 's')
		{
			this.r=this.scale * smooth_transpose2d( (BLOB_TRANS_DURAITION-this.frame)/BLOB_TRANS_DURAITION );
			this.frame--;
			let accMag = 1 + 5*smooth_transpose2d( this.frame/BLOB_TRANS_DURAITION );
			for(let i=0;i<3;i++) acc[i]*=accMag;
			for(let i=0;i<3;i++) this.pos[i]+=acc[i];
			if(this.frame <= 0) this.state = 'i';
		}
		else if(this.state == 'd')
		{
			this.r=this.scale * smooth_transpose2d( this.frame/BLOB_TRANS_DURAITION );
			this.frame--;
			if(this.frame <= 0) this.state = 'x';
		}
		else if(this.state == 'i') {for(let i=0;i<3;i++) this.pos[i]+=acc[i];}
	}
	checkOutFocus(center)
	{
		if(center - this._pos[2] >= 800 && this.state == 'i')
		{
			this.state = 'd';
			this.frame = BLOB_TRANS_DURAITION;
		}
	}
	isDead()
	{
		return (this.state == 'x');
	}
	render()
	{
		if(this.r <= 0 ) return;
		push();
		translate(this._pos);
		sphere(this.r);
		pop();
	}
}

class blobSystem
{
	constructor()
	{
		this._center = 0;
		this.blobs=[];
		this.frame = 0;
		for(let i=0; i<10; i++)
		{
			let v=p5.Vector.random3D();
			v = v.mult(randto(400,600));
			this.blobs.push( new blob(v.x, v.y, v.z) );
		}
	}
	get center()
	{
		return this._center;
	}
	control()
	{
		const c=this._center
		if(this.frame > 600)
		{
			let v=p5.Vector.random();
			v.mult(randto(250,500));
			this.blob.push( new blob(v.x, v.y, this._center + 500) );
		}
		this.blobs.forEach(function(e){
			e.movement();
			e.checkOutFocus(c);
		});
//		this._center.z++;
		if(this.frame > 600)
		{
			for(let i = this.blobs.length-1 ; i>=0; i++)
			{
				const blob = this.blobs[i];
				if(blob.isDead())
				{
					this.blobs.splice(i, 1);
				}
			}
			this.frame -=600;
		}
	}
	pickup()
	{
		let min=Infinity;
		let no=-1;
	}
	render()
	{
		this.blobs.forEach(function(e){
			e.render();
		});
	}
}

function setup()
{
	frameRate(60);
	createCanvas(windowWidth,windowHeight,WEBGL);
	myCam=new lybellP5Camera(0, 0, 0, 0,0,1000);
	myCam.initialize();
	bs=new blobSystem();
	debugMode();
	noStroke();
	fill("#24adaf");
}

function draw()
{
	background(255);
	if (keyIsDown(UP_ARROW) || keyIsDown(87) ) myCam.pan(0,1); //W
	if (keyIsDown(DOWN_ARROW) || keyIsDown(83) ) myCam.pan(0,-1); //S
	if (keyIsDown(LEFT_ARROW) || keyIsDown(65) ) myCam.pan(1,0); //A
	if (keyIsDown(RIGHT_ARROW) || keyIsDown(68) ) myCam.pan(-1,0); //D
	bs.control();
	bs.render();
}
