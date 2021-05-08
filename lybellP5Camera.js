class lybellP5Camera{
	constructor(eyeX=0, eyeY=0, eyeZ=(1920 / 2.0) / tan (PI * 30.0 / 180.0), targetX=0, targetY=0, targetZ=0)
	{
		this._pos=new p5.Vector(eyeX, eyeY, eyeZ);
		this._target=new p5.Vector(targetX, targetY, targetZ);
		this._dist=p5.Vector.sub(this._pos, this._target).mag();
		this.camera=createCamera(eyeX, eyeY, eyeZ, targetX, targetY, targetZ);
		this.minZoom=0;
		this.maxZoom=Infinity;
	}
	get pos()
	{
		return [this._pos.x, this._pos.y, this._pos.z];
	}
	get target()
	{
		return [this._target.x, this._target.y, this._target.z];
	}
	get dist()
	{
		return this._dist;
	}
	get AxisZ()
	{
		return p5.Vector.sub(this._target, this._pos).normalize();
	}
	apply()
	{
		this.camera.camera(this._pos.x, this._pos.y, this._pos.z, this._target.x, this._target.y, this._target.z);
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
				if(_x instanceof p5.Vector) this._pos.set(_x);
				break;
			case 2:
				if(_x instanceof p5.Vector && _y instanceof p5.Vector)
				{
					this._pos.set(_x);
					this._target.set(_y);
				}
				break;
			case 3:
				this._pos.set(_x,_y,_z);
				break;
			case 4:
				if(_x instanceof p5.Vector)
				{
					this._pos.set(_x);
					this._target.set(_y,_z,tx);
				}
				else if(tx instanceof p5.Vector)	
				{
					this._pos.set(_x,_y,_z);
					this._target.set(tx);
				}
				break;
			case 6:
				this._pos.set(_x,_y,_z);
				this._target.set(tx,ty,tz);
				break;
		}
		this.apply();
	}
	move(dx, dy, dz, absolute=false)
	{
		if(absolute)
		{
			this._pos.add(dx,dy,dz);
			this._target.add(dx,dy,dz);
		}
		else
		{
			const AxisZ=this.AxisZ;
			const AxisX=p5.Vector.cross(AxisZ, createVector(0,1,0)).normalize();
			const AxisY=p5.Vector.cross(AxisX, AxisZ).normalize();
			let vx=AxisX.x*dx + AxisY.x*dy + AxisZ.x*dz;
			let vy=AxisX.y*dx + AxisY.y*dy + AxisZ.y*dz;
			let vz=AxisX.z*dx + AxisY.z*dy + AxisZ.z*dz;
			this._pos.add(vx, vy, vz);
			this._target.add(vx,vy,vz);
		}
		this.apply();
	}
	rotate(_x, _y)
	{
		let rad=PI*1.0/180.0;
		let x=this._pos.x-this._target.x;
		let y=this._pos.y-this._target.y;
		let z=this._pos.z-this._target.z;
		
		let r=Math.sqrt(x*x + z*z);
		
		let sinY=Math.sin(_y*rad); let cosY=Math.cos(_y*rad);
		let sinX1=x/r; let cosX1=z/r;
		let sinX2=Math.sin(_x*rad); let cosX2=Math.cos(_x*rad);
		let yAngle=Math.atan2(y,r);
		let limiter = (Math.abs( Math.abs(yAngle) - PI/2 ) < 0.02 ) && ((yAngle * _y) < 0);
		
		let y1=y*cosY - r*sinY;
		let z1=r;
		if(!limiter) z1=y*sinY + r*cosY;
		
		let sinX=sinX1 * cosX2 + cosX1 * sinX2;
		let cosX=cosX1 * cosX2 - sinX1 * sinX2;
		
		this._pos.x=this._target.x + sinX*z1;
		if(!limiter) this._pos.y=this._target.y + y1;
		this._pos.z=this._target.z + cosX*z1;
		this.apply();
	}
	set dist(d)
	{
		let sub=p5.Vector.sub(this._pos, this._target);
		this._dist = d;
		sub.setMag(this._dist);
		this._pos = p5.Vector.add(sub, this._target);
		this.apply();
	}
	zoom(_z)
	{
		let newDist=this._dist * Math.pow(1.0002,_z);
		newDist=constrain(newDist, this.minZoom, this.maxZoom);
		this.dist = newDist;
	}
	pan(_x,_y)
	{
		let rad=PI*1.0/180.0;
		let x=this._target.x-this._pos.x;
		let y=this._target.y-this._pos.y;
		let z=this._target.z-this._pos.z;
		
		let r=Math.sqrt(x*x + z*z);
		
		let sinY=Math.sin(_y*rad); let cosY=Math.cos(_y*rad);
		let sinX1=x/r; let cosX1=z/r;
		if(r == 0) {sinX1=0; cosX1=1;}
		let sinX2=Math.sin(_x*rad); let cosX2=Math.cos(_x*rad);
		let yAngle=Math.atan2(y,r);
		let limiter = (Math.abs( Math.abs(yAngle) - PI/2 ) < 0.02 ) && ((yAngle * _y) < 0);
		
		let y1=y*cosY - r*sinY;
		let z1=r;
		if(!limiter) z1=y*sinY + r*cosY;
		
		let sinX=sinX1 * cosX2 + cosX1 * sinX2;
		let cosX=cosX1 * cosX2 - sinX1 * sinX2;
		
		this._target.x=this._pos.x + sinX*z1;
		if(!limiter) this._target.y=this._pos.y + y1;
		this._target.z=this._pos.z + cosX*z1;
		this.apply();
	}
	constrainZoom(_min=0, _max=Infinity)
	{
		this.minZoom=_min;
		this.maxZoom=_max;
	}
	getRay(x,y)
	{
		const AxisZ=this.AxisZ;
		const AxisX=p5.Vector.cross(AxisZ, createVector(0,1,0)).normalize();
		const AxisY=p5.Vector.cross(AxisX, AxisZ).normalize();
		const baseLen=this.camera.defaultEyeZ;
		let res=new p5.Vector(AxisX.x*x + AxisY.x*y + AxisZ.x * baseLen,
				      AxisX.y*x + AxisY.y*y + AxisZ.y * baseLen,
				      AxisX.z*x + AxisY.z*y + AxisZ.z * baseLen);
		return res;
	}
	screenTo3D(x, y, depth=1)
	{
		let ray=getRay(x,y);
		ray.mult(depth);
		ray.add(this._pos);
		return ray;
	}
	pointPick(mx, my, tx, ty, tz, dist)
	{
		let ray=getRay(mx,my);
		const pa=new p5.Vector(tx-this._pos.x, ty-this._pos.y, tz-this._pos.z);
		let forward=p5.Vector.dot(this.AxisZ, pa);
		if(forward <= 0) return false;
		return (p5.Vector.cross(pa, ray).mag() / ray.mag() <= dist);
	}
}
