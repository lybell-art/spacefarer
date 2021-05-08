class lybellP5Camera{
	constructor(eyeX=0, eyeY=0, eyeZ=(1920 / 2.0) / tan (PI * 30.0 / 180.0), targetX=0, targetY=0, targetZ=0)
	{
		this.pos=new p5.Vector(eyeX, eyeY, eyeZ);
		this.target=new p5.Vector(targetX, targetY, targetZ);
		this.dist=p5.Vector.sub(this.pos, this.target).mag();
		this.camera=createCamera(eyeX, eyeY, eyeZ, targetX, targetY, targetZ);
		this.minZoom=0;
		this.maxZoom=Infinity;
	}
	apply()
	{
		this.camera.camera(this.pos.x, this.pos.y, this.pos.z, this.target.x, this.target.y, this.target.z);
	}
	initialize(parent)
	{
		this.apply();
		if(parent instanceof p5 || parent instanceof p5.Graphics) parent.setCamera(this.camera);
		else if (p5 !== undefined && setCamera !== undefined && typeof setCamera === "function") setCamera(this.camera);
	}
	setPosition(_x, _y, _z, tx, ty, tz)
	{
		switch(arguments.length){
			case 1:
				if(_x instanceof p5.Vector) this.pos.set(_x);
				break;
			case 2:
				if(_x instanceof p5.Vector && _y instanceof p5.Vector)
				{
					this.pos.set(_x);
					this.target.set(_y);
				}
				break;
			case 3:
				this.pos.set(_x,_y,_z);
				break;
			case 4:
				if(_x instanceof p5.Vector)
				{
					this.pos.set(_x);
					this.target.set(_y,_z,tx);
				}
				else if(tx instanceof p5.Vector)	
				{
					this.pos.set(_x,_y,_z);
					this.target.set(tx);
				}
				break;
			case 6:
				this.pos.set(_x,_y,_z);
				this.target.set(tx,ty,tz);
				break;
		}
		this.apply();
	}
	move(dx, dy, dz, absolute=false)
	{
		if(absolute)
		{
			this.pos.add(dx,dy,dz);
			this.target.add(dx,dy,dz);
		}
		else
		{
			const AxisZ=p5.Vector.sub(this.target, this.pos).normalize();
			const AxisX=p5.Vector.cross(AxisZ, createVector(0,1,0)).normalize();
			const AxisY=p5.Vector.cross(AxisX, AxisZ).normalize();
			let vx=AxisX.x*dx + AxisY.x*dy + AxisZ.x*dz;
			let vy=AxisX.y*dx + AxisY.y*dy + AxisZ.y*dz;
			let vz=AxisX.z*dx + AxisY.z*dy + AxisZ.z*dz;
			this.pos.add(vx, vy, vz);
			this.target.add(vx,vy,vz);
		}
		this.apply();
	}
	rotate(_x, _y)
	{
		let rad=PI*1.0/180.0;
		let x=this.pos.x-this.target.x;
		let y=this.pos.y-this.target.y;
		let z=this.pos.z-this.target.z;
		
		let r=Math.sqrt(x*x + z*z);
		
		let sinY=Math.sin(_y*rad); let cosY=Math.cos(_y*rad);
		let sinX1=x/r; let cosX1=z/r;
		let sinX2=Math.sin(_x*rad); let cosX2=Math.cos(_x*rad);
		
		let y1=y*cosY - r*sinY;
		let z1=r;
		if(Math.abs((y-y1) / this.dist) >= 0.002) z1=y*sinY + r*cosY;
		
		let sinX=sinX1 * cosX2 + cosX1 * sinX2;
		let cosX=cosX1 * cosX2 - sinX1 * sinX2;
		
		this.pos.x=this.target.x + sinX*z1;
		if(Math.abs((y-y1) / this.dist) >= 0.002) this.pos.y=this.target.y + y1;
		this.pos.z=this.target.z + cosX*z1;
		this.apply();
	}
	setDist(d)
	{
		let sub=p5.Vector.sub(this.pos, this.target);
		this.dist = d;
		sub.setMag(this.dist);
		this.pos = p5.Vector.add(sub, this.target);
		this.apply();
	}
	zoom(_z)
	{
		let newDist=this.dist * Math.pow(1.0002,_z);
		newDist=constrain(newDist, this.minZoom, this.maxZoom);
		this.setDist(newDist);
	}
	pan(_x,_y)
	{
		let rad=PI*1.0/180.0;
		let x=this.target.x-this.pos.x;
		let y=this.target.y-this.pos.y;
		let z=this.target.z-this.pos.z;
		
		let r=Math.sqrt(x*x + z*z);
		console.log(_x, _y, x, y, z, r);
		
		let sinY=Math.sin(_y*rad); let cosY=Math.cos(_y*rad);
		let sinX1=x/r; let cosX1=z/r;
		if(r == 0) {sinX1=0; cosX1=1;}
		let sinX2=Math.sin(_x*rad); let cosX2=Math.cos(_x*rad);
		
		let y1=y*cosY - r*sinY;
		let z1=r;
		console.log(sinY, cosY, sinX1, cosX1, sinX2, cosX2, y1);
		if(Math.abs((y-y1) / this.dist) >= 0.002) z1=y*sinY + r*cosY;
		
		let sinX=sinX1 * cosX2 + cosX1 * sinX2;
		let cosX=cosX1 * cosX2 - sinX1 * sinX2;
		
		this.target.x=this.pos.x + sinX*z1;
		if(Math.abs((y-y1) / this.dist) >= 0.002) this.target.y=this.pos.y + y1;
		this.target.z=this.pos.z + cosX*z1;
		this.apply();
	}
	constrainZoom(_min=0, _max=Infinity)
	{
		this.minZoom=_min;
		this.maxZoom=_max;
	}
	screenTo3D(x, y, depth=1)
	{
		const AxisZ=p5.Vector.sub(this.target, this.pos).normalize();
		const AxisX=p5.Vector.cross(AxisZ, createVector(0,1,0)).normalize();
		const AxisY=p5.Vector.cross(AxisX, AxisZ).normalize();
		const baseLen=this.camera.defaultEyeZ;
		let baseO=p5.Vector.add(this.pos, p5.Vector.mult(AxisZ, baseLen*depth));
		baseO.add(p5.Vector.mult(AxisX, x*depth));
		baseO.add(p5.Vector.mult(AxisY, y*depth));
		return baseO;
	}
}
