let bs, myCam;
let myShader;
let c=0.0;

function smooth_transpose2d(d)
{
	if(d < 0) return 0;
	else if(d > 1) return 1;
	return d*d*d*d*d*d*d;
}
function randto(min, max, integer=false)
{
	let dist=max-min;
	let res=Math.random() * dist + min;
	if(integer) res=Math.floor(res);
	return res;
}
function vecToAngle(x, y, z)
{
	let r=Math.sqrt(x*x + z*z);
	let theta=Math.atan2(z,x);
	let phi=Math.atan2(y,r);
	return {theta:theta, phi:phi};
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
		if(isSplit)
		{
			this.state = '_';
			this.scale *= 0.5;
		}
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
			let accMag = 1 + 100*smooth_transpose2d( this.frame/BLOB_TRANS_DURAITION );
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
	pickingCheck(ray, AxisZ, cx, cy, cz)
	{
		const pa=new p5.Vector(this._pos[0]-cx, this._pos[1]-cy, this._pos[2]-cz);
		let forward=p5.Vector.dot(AxisZ, pa);
		if(forward <= 0) return false;
		return (p5.Vector.cross(pa, ray).mag() / ray.mag() <= this.r);
	}
	getDistTo(cx, cy, cz)
	{
		let x=this._pos[0]-cx;
		let y=this._pos[1]-cy;
		let z=this._pos[2]-cz;
		return x*x+ y*y + z*z;
	}
	isIdle()
	{
		return (this.state == 'i');
	}
	isDead()
	{
		return (this.state == 'x');
	}
	startSplit()
	{
		if(this.state == 'i')
		{
			this.state = 'd';
			this.frame = BLOB_TRANS_DURAITION;
		}
	}
	render()
	{
		if(this.r <= 0 ) return;
		push();
		translate(this._pos[0], this._pos[1], this._pos[2]);
		let angles = vecToAngle(this.dir[0], this.dir[1], this.dir[2]);
		rotateZ(angles.phi);
		rotateY(angles.theta);
		sphere(this.r, 80, 80);
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
	pickup(mx, my, cam)
	{
		let min=Infinity;
		let no=-1;
		let ray=cam.getRay(mx,my);
		let front=cam.AxisZ;
		let center=cam.pos;
		let targetBlob=null;
		this.blobs.forEach(function(e, i){
			let rayCasted = e.pickingCheck(ray, front, center[0], center[1], center[2]);
			if(rayCasted && e.isIdle())
			{
				let tmp=e.getDistTo(center[0], center[1], center[2]);
				if(tmp < min)
				{
					min = tmp;
					no = i;
				}
			}
		});
		console.log(no);
		if(no > -1)
		{
			targetBlob=this.blobs[no];
			targetBlob.startSplit();
			for(let i=0;i<2;i++) this.blobs.push(new blob(targetBlob.pos[0], targetBlob.pos[1], targetBlob.pos[2], true));
		}
		return targetBlob;
	}
	render()
	{
		this.blobs.forEach(function(e){
			e.render();
		});
	}
}
function preload()
{
	myShader=loadShader('shaders/shader.vert','shaders/shader.frag');
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
	myShader.setUniform("uFrameCount", frameCount);
	shader(myShader);
	bs.control();
	bs.render();
}

function mousePressed()
{
	bs.pickup(mouseX - windowWidth/2,mouseY - windowHeight/2,myCam);
}
