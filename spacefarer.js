let bs, myCam, freeCam=false;
let spaceship, shipTex;
let myShader;
const SCENE_DURATION = 500;

function smooth_transpose2d(d, pow=3)
{
	if(d < 0) return 0;
	else if(d > 1) return 1;
	let dd=d * pow;
	let emax=Math.exp(pow);
	return (Math.exp(dd)-1)/(emax -1);
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

const BLOB_TRANS_DURAITION = 60;
class blob
{
	constructor(x,y,z, s=null, isSplit=false)
	{
		this._pos=[x,y,z];
		let rand3d=p5.Vector.random3D();
		this.dir=[rand3d.x/2, rand3d.y/2, rand3d.z/2];
		this.scale=constrain(randomGaussian(50,20), 0, 100);
		this.r=0;
		this.frame=BLOB_TRANS_DURAITION;
		this.state='g'; //g:generate i:idle s:split d:destroy x:pending-removal _:pending-split
		if(s !== null) this.scale=s;
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
			let accMag = 1 + 6*smooth_transpose2d( this.frame/BLOB_TRANS_DURAITION );
			for(let i=0;i<3;i++) acc[i]*=accMag;
			for(let i=0;i<3;i++) this._pos[i]+=acc[i];
			if(this.frame <= 0) this.state = 'i';
		}
		else if(this.state == 'd')
		{
			this.r=this.scale * smooth_transpose2d( this.frame/BLOB_TRANS_DURAITION );
			this.frame--;
			if(this.frame <= 0) this.state = 'x';
		}
		else if(this.state == 'i') {for(let i=0;i<3;i++) this._pos[i]+=acc[i];}
	}
	checkOutFocus(center)
	{
		if(center - this._pos[2] >= 600 && this.state == 'i')
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
		rotateY(-angles.theta);
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
			v = v.mult(randto(200,400));
			this.blobs.push( new blob(v.x, v.y, v.z) );
		}
	}
	get center()
	{
		return this._center;
	}
	control()
	{
		const CHECKING_FRAME=150;
		const c=this._center
		if(this.frame > CHECKING_FRAME)
		{
			let v=p5.Vector.random2D();
			v.mult(randto(100,300));
			this.blobs.push( new blob(v.x, v.y, this._center + 600) );
		}
		this.blobs.forEach(function(e){
			e.movement();
			e.checkOutFocus(c);
		});
		this._center++;
		if(this.frame > CHECKING_FRAME)
		{
			for(let i = this.blobs.length-1 ; i>=0; i--)
			{
				let blob = this.blobs[i];
				if(blob.isDead())
				{
					this.blobs.splice(i, 1);
				}
			}
			this.frame -=CHECKING_FRAME;
		}
		this.frame++;
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
		if(no > -1)
		{
			targetBlob=this.blobs[no];
			targetBlob.startSplit();
			for(let i=0;i<2;i++) this.blobs.push(new blob(targetBlob.pos[0], targetBlob.pos[1], targetBlob.pos[2], targetBlob.scale, true));
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
function cameraMovement(cam, center, mode)
{
	let cenBase=center - center % SCENE_DURATION + SCENE_DURATION/2;
	switch(mode){
		case 0:
		cam.setPosition(-350, -400, cenBase+200 - center % SCENE_DURATION, 0, 0, cenBase);
		break;
		case 1:
		cam.setPosition(-500, -100, cenBase, 0, 0, cenBase - SCENE_DURATION/4 + (center % SCENE_DURATION) /2);
		break;
		case 2:
		cam.setPosition(0, -500, cenBase+100, 0, 0, cenBase);
		break;
		case 3:
		cam.setPosition(-100, 500, cenBase+200, 0, 0, cenBase);
		break;
	}
}

function preload()
{
	myShader=loadShader('shaders/shader.vert','shaders/shader.frag');
	spaceship = loadModel('data/spaceship.obj', true);
	shipTex = loadImage('data/spaceship_mapping.png');
}

function setup()
{
	frameRate(60);
	createCanvas(windowWidth,windowHeight,WEBGL);
	myCam=new lybellP5Camera(0, 0, -500, 0,0,0);
	myCam.initialize();
	bs=new blobSystem();
	noStroke();
}

function draw()
{
	const deg = bs.center * PI/180;
	background(Math.sin(deg)*30 + 30, 40, Math.cos(deg)*60 + 60);
	if(freeCam)
	{
		if (keyIsDown(UP_ARROW) || keyIsDown(87) ) myCam.pan(0,1); //W
		if (keyIsDown(DOWN_ARROW) || keyIsDown(83) ) myCam.pan(0,-1); //S
		if (keyIsDown(LEFT_ARROW) || keyIsDown(65) ) myCam.pan(1,0); //A
		if (keyIsDown(RIGHT_ARROW) || keyIsDown(68) ) myCam.pan(-1,0); //D
		myCam.move(0,0,1,true);
	}
	else
	{
		let camMode = Math.floor(bs.center / SCENE_DURATION) % 4;
		cameraMovement(myCam, bs.center, camMode);
	}
	myShader.setUniform("uFrameCount", frameCount);
	shader(myShader);
	bs.control();
	bs.render();
	resetShader();
	ambientLight(190);
	directionalLight(210, 210, 210, 1, 1, 1);
	directionalLight(105, 105, 105, -0.6, -1, -0.7);
	push();
	translate(0,0,bs.center);
	rotateZ(PI);
	rotateY(PI/2);
	scale(0.6);
	texture(shipTex);
	model(spaceship);
	pop();
}

function keyPressed()
{
	if (keyCode === 32) {
		freeCam = !freeCam;
		if(freeCam) cameraMovement(myCam, bs.center, 0);
	}
}

function mousePressed()
{
	bs.pickup(mouseX - windowWidth/2,mouseY - windowHeight/2,myCam);
}
function windowResized()
{
	resizeCanvas(windowWidth, windowHeight, false);
	myCam.apply();
}
