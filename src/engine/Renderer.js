import * as THREE from 'three';

/**
 * Renderer - Three.js setup optimized for tablets
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(65, this.width / this.height, 0.1, 200);
    this.camera.position.set(32, 20, 40);
    this.camera.lookAt(32, 10, 32);

    // Renderer (optimized for tablet)
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // Disable for performance on tablets
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap; // Fast shadows
    this.renderer.setClearColor(0x87CEEB); // Sky blue

    // Fog for performance (hide distant chunks)
    this.scene.fog = new THREE.Fog(0x87CEEB, 40, 80);

    this.setupLighting();
    this.setupSkybox();

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onResize(), 100);
    });
  }

  setupLighting() {
    // Ambient light (warm)
    const ambient = new THREE.AmbientLight(0xfff5e6, 0.6);
    this.scene.add(ambient);

    // Hemisphere light (sky + ground bounce)
    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x8B6914, 0.3);
    this.scene.add(hemi);

    // Directional light (sun)
    this.sunLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
    this.sunLight.position.set(30, 50, 30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -40;
    this.sunLight.shadow.camera.right = 40;
    this.sunLight.shadow.camera.top = 40;
    this.sunLight.shadow.camera.bottom = -40;
    this.scene.add(this.sunLight);
  }

  setupSkybox() {
    // Simple gradient sky using a large sphere
    const skyGeo = new THREE.SphereGeometry(150, 16, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x4a90d9) },
        bottomColor: { value: new THREE.Color(0x87CEEB) },
        offset: { value: 10 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.sky);
  }

  setSkyColors(topColor, bottomColor, fogColor) {
    if (this.sky) {
      this.sky.material.uniforms.topColor.value.set(topColor);
      this.sky.material.uniforms.bottomColor.value.set(bottomColor);
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
