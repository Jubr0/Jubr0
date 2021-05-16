const shader = {
  vertex: `
		//
		// Description : Array and textureless GLSL 2D simplex noise function.
		//      Author : Ian McEwan, Ashima Arts.
		//  Maintainer : ijm
		//     Lastmod : 20110822 (ijm)
		//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
		//               Distributed under the MIT License. See LICENSE file.
		//               https://github.com/ashima/webgl-noise
		//

		vec3 mod289(vec3 x) {
		return x - floor(x * (1.0 / 289.0)) * 289.0;
		}

		vec2 mod289(vec2 x) {
		return x - floor(x * (1.0 / 289.0)) * 289.0;
		}

		vec3 permute(vec3 x) {
		return mod289(((x*34.0)+1.0)*x);
		}

		float snoise(vec2 v)
		{
		const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
		0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
		-0.577350269189626,  // -1.0 + 2.0 * C.x
		0.024390243902439); // 1.0 / 41.0
		// First corner
		vec2 i  = floor(v + dot(v, C.yy) );
		vec2 x0 = v -   i + dot(i, C.xx);

		// Other corners
		vec2 i1;
		//i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
		//i1.y = 1.0 - i1.x;
		i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
		// x0 = x0 - 0.0 + 0.0 * C.xx ;
		// x1 = x0 - i1 + 1.0 * C.xx ;
		// x2 = x0 - 1.0 + 2.0 * C.xx ;
		vec4 x12 = x0.xyxy + C.xxzz;
		x12.xy -= i1;

		// Permutations
		i = mod289(i); // Avoid truncation effects in permutation
		vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

		vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
		m = m*m ;
		m = m*m ;

		// Gradients: 41 points uniformly over a line, mapped onto a diamond.
		// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

		vec3 x = 2.0 * fract(p * C.www) - 1.0;
		vec3 h = abs(x) - 0.5;
		vec3 ox = floor(x + 0.5);
		vec3 a0 = x - ox;

		// Normalise gradients implicitly by scaling m
		// Approximation of: m *= inversesqrt( a0*a0 + h*h );
		m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

		// Compute final noise value at P
		vec3 g;
		g.x  = a0.x  * x0.x  + h.x  * x0.y;
		g.yz = a0.yz * x12.xz + h.yz * x12.yw;
		return 130.0 * dot(m, g);
		}

		uniform float amplitude;
		uniform float time;
		attribute float id;
		attribute float texId;
		attribute float size;
		attribute vec3 colour;

		varying vec4 vColor;
		varying float texIndex;

		void main() {
			if(size > 0.8)
			{
				texIndex = texId;

				float a = (80.0-size)*0.01;
				a = a > 1.0? 1.0: a;
				a = a < 0.0? 0.0: a;
				a *= (snoise(vec2(id, time*0.5))*0.5+0.5);
				vColor = vec4(colour, a);

				vec3 noise = vec3(snoise(vec2(id, time))*2.0, snoise(vec2(id, time + 10000.0))*2.0, 0.0);

				vec4 mvPosition = modelViewMatrix * vec4( position + noise, 1.0 );

				gl_PointSize = size * 1.0 * ( 300.0 / length( mvPosition.xyz ) ) + 2.0;

				gl_Position = projectionMatrix * mvPosition;

			}
			else
			gl_PointSize = 0.0;
		}
    `,
  fragment: `
		uniform vec3 color;
		uniform sampler2D tex;

		varying vec4 vColor;

		void main() {
			gl_FragColor = texture2D( tex, gl_PointCoord );
		}
    `
};

class FPS {
  startTime = Date.now();
  prevTime = this.startTime;

  ms = 0;
  msMin = Infinity;
  msMax = 0;
  fps = 0;
  fpsMin = Infinity;
  fpsMax = 0;
  frames = 0;

  begin = () => {
    this.startTime = Date.now();
  };

  end = () => {
    const time = Date.now();

    this.ms = time - this.startTime;
    this.msMin = Math.min(this.msMin, this.ms);
    this.msMax = Math.max(this.msMax, this.ms);

    this.frames++;

    if (time > this.prevTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (time - this.prevTime));
      this.fpsMin = Math.min(this.fpsMin, this.fps);
      this.fpsMax = Math.max(this.fpsMax, this.fps);

      this.prevTime = time;
      this.frames = 0;
    }

    return time;
  };

  update = () => {
    this.startTime = this.end();
  };
}

class Particles {
  frameId = null;
  active = false;
  fps = new FPS();
  currTime = 0;
  mouseX = -10000;
  mouseY = -10000;
  windowHalfX = 0;
  windowHalfY = 0;
  renderer = null;
  camera = null;
  scene = null;
  particles = null;
  springStrength = 0.001;
  mouseRadius = 5000;
  mouseStrength = 0.2;
  damping = 0.002;
  imageParticlePositions = [];
  shaderMaterial = null;
  sourceImageW = 0;
  sourceImageH = 0;
  particleDensity = 1;
  numToDraw = 0;
  particleFadeTime = 0.01;

  init = (canvas, particleData, sourceImageW, sourceImageH, options) => {
    this.scale = (options && options.scale) || 0.5;
    this.particleScale = (options && options.particleScale) || 1;

    this.sourceImageW = sourceImageW;
    this.sourceImageH = sourceImageH;

    this.imageParticlePositions = particleData.trim().split(" ");

    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;

    this.camera = new THREE.OrthographicCamera(
      -this.windowHalfX,
      this.windowHalfX,
      -this.windowHalfY,
      this.windowHalfY,
      -500,
      1000
    );
    this.camera.position.z = 1000;
    this.scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2(0x000000, 0.0008);

    const uniforms = {
      amplitude: {
        type: "f",
        value: 1.0
      },
      time: {
        type: "f",
        value: 0
      },
      color: {
        type: "c",
        value: new THREE.Color((options && options.particleColor) || "#fff")
      },
      tex: {
        type: "t",
        value: new THREE.TextureLoader().load("/images/particle_2.jpg")
      }
    };

    this.shaderMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: shader.vertex,
      fragmentShader: shader.fragment,

      blending: (options && options.blendMode) || THREE.SubtractiveBlending,
      depthTest: false,
      transparent: true
    });

    this.setParticleDensity(1);

    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.renderer.setClearColor((options && options.backgroundColor) || "#fff");

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    document.addEventListener("mousemove", this.onDocumentMouseMove, false);
    document.addEventListener("touchstart", this.onDocumentTouchStart, false);
    document.addEventListener("touchend", this.onDocumentTouchEnd, false);
    window.addEventListener("resize", this.onWindowResize, false);

    this.start();
  };

  setParticleDensity = factor => {
    const nParticles = Math.floor(this.imageParticlePositions.length * factor);
    const geometry = new THREE.BufferGeometry();
    // geometry.dynamic = true;

    const positions = new Float32Array(nParticles * 3);
    const colours = new Float32Array(nParticles * 3);
    const sizes = new Float32Array(nParticles);
    const ids = new Float32Array(nParticles);

    geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute("colour", new THREE.BufferAttribute(colours, 3));
    geometry.addAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.addAttribute("id", new THREE.BufferAttribute(ids, 1));

    if (this.particles) this.scene.remove(this.particles);
    this.particles = new THREE.Points(geometry, this.shaderMaterial);

    const initPositions = [];
    const initSizes = [];
    const particleVelocities = [];
    const particleActive = [];

    for (let v = 0; v < nParticles; v++) {
      const particleInfo = this.imageParticlePositions[v].split(",");

      const vertex = new THREE.Vector3();
      vertex.x =
        (parseInt(particleInfo[0]) - this.sourceImageW / 2) * this.scale;
      vertex.y =
        (parseInt(particleInfo[1]) - this.sourceImageH / 2) * this.scale;
      //vertex.x =  Math.random()*window.innerWidth-this.windowHalfX;
      //vertex.y =  Math.random()*window.innerHeight-this.windowHalfY;
      vertex.z = 0;

      initPositions.push(vertex.clone());
      particleVelocities.push(new THREE.Vector3());
      particleActive.push(0);

      const size = (parseInt(particleInfo[2]) / 100) * 10 + 3;
      initSizes.push(size);

      positions[v * 3 + 0] = vertex.x;
      positions[v * 3 + 1] = vertex.y;
      positions[v * 3 + 2] = 0;

      colours[v * 3 + 0] = 1;
      colours[v * 3 + 1] = 1;
      colours[v * 3 + 2] = 1;

      sizes[v] = 0;

      ids[v] = v;
    }

    this.particles.initPositions = initPositions;
    this.particles.activeness = particleActive;
    this.particles.initSizes = initSizes;
    this.particles.positions = positions;
    this.particles.velocities = particleVelocities;
    this.particles.sizes = sizes;

    this.scene.add(this.particles);
  };

  onWindowResize = () => {
    //this.windowHalfX = window.innerWidth / 2;
    //this.windowHalfY = window.innerHeight / 2;

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  onDocumentMouseMove = event => {
    this.mouseX = event.clientX - this.windowHalfX;
    this.mouseY = event.clientY - this.windowHalfY;
  };

  onDocumentTouchStart = event => {
    this.mouseX = event.changedTouches[0].clientX - this.windowHalfX;
    this.mouseY = event.changedTouches[0].clientY - this.windowHalfY;
    console.log(event);
  };

  onDocumentTouchEnd = event => {
    this.mouseX = -9999;
    this.mouseY = -9999;
  };

  animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    this.render();
  };

  start = () => {
    if (this.active) return;
    this.active = true;
    this.frameId = requestAnimationFrame(this.animate);
  };

  stop = () => {
    this.active = false;
    cancelAnimationFrame(this.frameId);
  };

  render = () => {
    this.fps.update();

    if (this.particles === null) return;

    if (this.fps.ms < 25) this.numToDraw += 1000;
    else if (this.fps.ms > 50) this.numToDraw -= 1000;

    this.numToDraw = Math.min(
      Math.max(this.numToDraw, 0),
      this.particles.initPositions.length
    );

    //console.log(this.fps.ms);
    //	if(this.fps.fps < 20 && this.particleDensity !== 0.5){
    //		this.particleDensity = 0.5;
    //		this.setParticleDensity(this.particleDensity);
    //
    //	}

    for (let i = 0; i < this.particles.initPositions.length; i++) {
      if (i < this.numToDraw) {
        if (this.particles.activeness[i] < 1)
          this.particles.activeness[i] += this.particleFadeTime;
        else this.particles.activeness[i] = 1;
      } else {
        if (this.particles.activeness[i] > 0)
          this.particles.activeness[i] -= this.particleFadeTime;
        else this.particles.activeness[i] = 0;
      }

      if (this.particles.activeness[i] > 0) {
        const pos = new THREE.Vector3(
          this.particles.positions[i * 3],
          this.particles.positions[i * 3 + 1],
          this.particles.positions[i * 3 + 2]
        );

        //force toward starting point
        const posToAnchor = new THREE.Vector3();
        posToAnchor.subVectors(pos, this.particles.initPositions[i]);
        const force = posToAnchor.clone();
        force.multiplyScalar(-this.springStrength);

        //damping force
        const damp = new THREE.Vector3();
        damp.set(
          this.particles.velocities[i].x,
          this.particles.velocities[i].y,
          this.particles.velocities[i].z
        );
        damp.multiplyScalar(-this.damping);
        // force.add(damp);

        //force away from mouse
        const d = new THREE.Vector3();
        d.subVectors(new THREE.Vector3(this.mouseX, this.mouseY, 0), pos);
        const dMag = (d.x * d.x + d.y * d.y) * 0.05;
        let strength;
        if (dMag < this.mouseRadius) {
          strength = Math.min(-this.mouseStrength / dMag, 0.05);
        } else strength = 0;

        d.multiplyScalar(strength);
        force.add(d);

        this.particles.velocities[i].add(force);
        pos.add(this.particles.velocities[i]);

        this.particles.positions[i * 3] = pos.x;
        this.particles.positions[i * 3 + 1] = pos.y;
        this.particles.positions[i * 3 + 2] = pos.z;

        const distToAnchor =
          posToAnchor.x * posToAnchor.x + posToAnchor.y * posToAnchor.y;
        const size = Math.min(
          Math.sin(distToAnchor / 500) * distToAnchor * 0.004 +
            this.particles.initSizes[i],
          100
        );
        this.particles.sizes[i] =
          size * this.particles.activeness[i] * this.particleScale;
      }
    }

    this.currTime += 0.005;
    this.particles.material.uniforms.time.value = this.currTime;
    //Date.now() * 0.005;

    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.size.needsUpdate = true;

    //camera.position.z = mouseY;

    this.renderer.render(this.scene, this.camera);
  };
}
