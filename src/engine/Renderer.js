import * as THREE from 'three';

/**
 * Renderer - Three.js setup with procedural cloud sky, better lighting
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(65, this.width / this.height, 0.1, 200);
    this.camera.position.set(32, 20, 40);
    this.camera.lookAt(32, 10, 32);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.renderer.setClearColor(0x87CEEB);

    this.scene.fog = new THREE.Fog(0x87CEEB, 40, 80);

    this.clouds = [];
    this.setupLighting();
    this.setupSkybox();
    this.setupClouds();

    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onResize(), 100);
    });
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xfff5e6, 0.55);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x8B6914, 0.35);
    this.scene.add(hemi);

    this.sunLight = new THREE.DirectionalLight(0xfff0d0, 0.9);
    this.sunLight.position.set(25, 50, 25);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -40;
    this.sunLight.shadow.camera.right = 40;
    this.sunLight.shadow.camera.top = 40;
    this.sunLight.shadow.camera.bottom = -40;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);
  }

  setupSkybox() {
    const skyGeo = new THREE.SphereGeometry(150, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x1a6bbf) },
        midColor: { value: new THREE.Color(0x5da0d9) },
        bottomColor: { value: new THREE.Color(0x87CEEB) },
        sunDir: { value: new THREE.Vector3(0.4, 0.6, 0.4).normalize() },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        uniform vec3 sunDir;
        uniform float time;
        varying vec3 vNormal;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                     mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
        }
        float fbm(vec2 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
          return v;
        }

        void main() {
          vec3 dir = normalize(vNormal);
          float h = dir.y;
          vec3 sky = h > 0.0 ? mix(midColor, topColor, pow(h, 0.6))
                              : mix(midColor, bottomColor, pow(-h, 0.3));

          // Sun glow
          float sunDot = max(dot(dir, sunDir), 0.0);
          sky += vec3(1.0, 0.95, 0.85) * pow(sunDot, 32.0) * 0.4;
          sky += vec3(1.0, 0.95, 0.85) * pow(sunDot, 8.0) * 0.1;

          // Clouds in sky
          if (h > 0.05) {
            vec2 uv = dir.xz / (h + 0.1) * 3.0 + time * 0.02;
            float cloud = smoothstep(0.35, 0.65, fbm(uv));
            sky = mix(sky, vec3(1.0), cloud * smoothstep(0.05, 0.3, h) * 0.8);
          }

          gl_FragColor = vec4(sky, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.sky);
  }

  setupClouds() {
    const cloudTex = this.createCloudTexture();
    for (let i = 0; i < 15; i++) {
      const mat = new THREE.SpriteMaterial({
        map: cloudTex, transparent: true,
        opacity: 0.5 + Math.random() * 0.3,
        depthWrite: false, fog: false,
      });
      const sprite = new THREE.Sprite(mat);
      const scale = 12 + Math.random() * 18;
      sprite.scale.set(scale, scale * 0.35, 1);
      sprite.position.set(
        Math.random() * 120 - 28,
        32 + Math.random() * 20,
        Math.random() * 120 - 28
      );
      sprite.userData.speed = 0.2 + Math.random() * 0.4;
      sprite.userData.baseX = sprite.position.x;
      this.scene.add(sprite);
      this.clouds.push(sprite);
    }
  }

  createCloudTexture() {
    const s = 128;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    const cx = s / 2, cy = s / 2;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.8)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.15)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 4; i++) {
      const px = cx + (Math.random() - 0.5) * s * 0.4;
      const py = cy + (Math.random() - 0.5) * s * 0.25;
      const pr = s * 0.12 + Math.random() * s * 0.12;
      const g2 = ctx.createRadialGradient(px, py, 0, px, py, pr);
      g2.addColorStop(0, 'rgba(255,255,255,0.4)');
      g2.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  updateClouds(time) {
    for (const cloud of this.clouds) {
      cloud.position.x = cloud.userData.baseX + Math.sin(time * 0.00008 * cloud.userData.speed) * 20;
    }
    if (this.sky && this.sky.material.uniforms) {
      this.sky.material.uniforms.time.value = time * 0.001;
    }
  }

  setSkyColors(topColor, bottomColor, fogColor) {
    if (this.sky && this.sky.material.uniforms) {
      this.sky.material.uniforms.topColor.value.set(topColor);
      this.sky.material.uniforms.bottomColor.value.set(fogColor);
      this.sky.material.uniforms.midColor.value.set(bottomColor);
    }
    this.scene.fog.color.set(fogColor);
    this.renderer.setClearColor(fogColor);
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
